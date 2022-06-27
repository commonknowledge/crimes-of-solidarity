import { SolidarityActionsList } from "../components/SolidarityActions";
import {
  SolidarityAction,
  Company,
  Category,
  Country,
  OrganisingGroup,
  Type,
  Status,
  Year,
} from "../data/types";
import Link from "next/link";
import { projectStrings } from "../data/site";
import Map from "../components/Map";
import { CumulativeMovementChart } from "../components/ActionChart";
import { useMemo, useState, createContext, useEffect } from "react";
import Fuse from "fuse.js";
import pluralize from "pluralize";
import { useURLStateFactory } from "../utils/state";
import { ensureArray, toggleInArray, stringifyArray } from "../utils/string";
import { Listbox, Disclosure } from "@headlessui/react";
import { useRouter } from "next/dist/client/router";
import useSWR from "swr";
import { useContextualRouting } from "next-use-contextual-routing";
import {
  OrganisingGroupCard,
  OrganisingGroupDialog,
  useSelectedOrganisingGroup,
} from "../components/OrganisingGroup";
import { UnionsByCountryData } from "../pages/api/organisingGroupsByCountry";
import { ChevronRightIcon } from "@heroicons/react/outline";
import { scrollToYear } from "../utils/router";
import { groupUrl } from "../data/organisingGroup";
import cx from "classnames";
import { groupBy } from "lodash";
import { FilterButton, FilterOption } from "./Filter";
import { memoize } from "lodash";

export const FilterContext = createContext<{
  search?: string;
  matches: Fuse.FuseResult<SolidarityAction>[];
  years?: string[];
  types?: string[];
  statuses?: string[];
  categories?: string[];
  countries?: string[];
  companies?: string[];
  groups?: string[];
  hasFilters: boolean;
}>({ matches: [], hasFilters: false });

export function SolidarityActionsTimeline({
  actions,
  companies,
  categories,
  countries,
  groups,
  years,
  types,
  statuses,
}: {
  actions: SolidarityAction[];
  companies: Company[];
  categories: Category[];
  countries: Country[];
  groups: OrganisingGroup[];
  years: Year[];
  types: Type[];
  statuses: Status[];
}) {
  const router = useRouter();
  const useURLState = useURLStateFactory();

  /**
   * Categories
   */
  const [filteredCategoryNames, setCategories, categoryMetadata] = useURLState<
    string[]
  >({
    key: "category",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleCategory = (category: string) => {
    setCategories((categories) => toggleInArray(categories, category));
  };
  const selectedCategories = useMemo(
    () =>
      filteredCategoryNames
        .map((name) => categories.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredCategoryNames]
  );

  /**
   * Years
   */
  const [filteredYears, setYears, yearsMetadata] = useURLState<string[]>({
    key: "year",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleYear = (year: string) => {
    setYears((years) => toggleInArray(years, year));
  };
  const selectedYears = useMemo(
    () =>
      filteredYears
        .map((name) => years.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredYears]
  );

  /**
   * Types
   */
  const [filteredTypes, setTypes, typesMetadata] = useURLState<string[]>({
    key: "type",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleType = (type: string) => {
    setTypes((types) => toggleInArray(types, type));
  };
  const selectedTypes = useMemo(
    () =>
      filteredTypes
        .map((name) => types.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredTypes]
  );

  /**
   * Statuses
   */
  const [filteredStatuses, setStatuses, statusesMetadata] = useURLState<
    string[]
  >({
    key: "status",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleStatus = (status: string) => {
    setStatuses((statuses) => toggleInArray(statuses, status));
  };
  const selectedStatuses = useMemo(
    () =>
      filteredStatuses
        .map((name) => statuses.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredStatuses]
  );

  /**
   * Companies
   */
  const [filteredCompanyNames, setCompanies, companiesMetadata] = useURLState({
    key: "company",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleCompany = (id: string) => {
    setCompanies((companies) => toggleInArray(companies, id));
  };
  const selectedCompanies = useMemo(
    () =>
      filteredCompanyNames
        .map((name) => companies.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredCompanyNames]
  );

  /**
   * Countries
   */
  const [filteredCountrySlugs, setCountries, countriesMetadata] = useURLState({
    key: "country",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleCountry = (id: string) => {
    setCountries((countries) => toggleInArray(countries, id));
  };
  const selectedCountries = useMemo(
    () =>
      filteredCountrySlugs
        .map((slug) => countries.find((c) => c.fields.Slug === slug)!)
        .filter(Boolean),
    [filteredCountrySlugs]
  );

  /**
   * OrganisingGroups
   */
  const [
    filteredOrganisingGroupNames,
    setOrganisingGroups,
    organisingGroupMetadata,
  ] = useURLState({
    key: "group",
    emptyValue: [],
    serialiseObjectToState: (key, urlData) =>
      urlData ? (ensureArray(urlData) as string[]) : [],
  });
  const toggleOrganisingGroup = (id: string) => {
    setOrganisingGroups((groups) => toggleInArray(groups, id));
  };
  const selectedOrganisingGroups = useMemo(
    () =>
      filteredOrganisingGroupNames
        .map((name) => groups.find((c) => c.fields.Name === name)!)
        .filter(Boolean),
    [filteredOrganisingGroupNames]
  );

  /**
   * Full text search
   */
  const [filterText, setFilterText, filterTextMetadata] = useURLState<string>({
    key: "search",
    emptyValue: "",
    serialiseObjectToState: (key, urlData) => urlData?.toString() || "",
  });

  /**
   * Filter metadata
   */
  const hasFilters = !!(
    filterText.length ||
    selectedOrganisingGroups.length ||
    selectedCountries.length ||
    selectedCompanies.length ||
    selectedCategories.length ||
    selectedYears.length ||
    selectedTypes.length ||
    selectedStatuses.length
  );

  const clearAllFilters = () => {
    setFilterText(filterTextMetadata.emptyValue);
    setYears(yearsMetadata.emptyValue);
    setTypes(typesMetadata.emptyValue);
    setStatuses(statusesMetadata.emptyValue);
    setCountries(countriesMetadata.emptyValue);
    setCategories(categoryMetadata.emptyValue);
    setCompanies(companiesMetadata.emptyValue);
    setOrganisingGroups(organisingGroupMetadata.emptyValue);
  };

  /**
   * Filtering
   */
  const [matches, setMatches] = useState<Fuse.FuseResult<SolidarityAction>[]>(
    []
  );

  const search = useMemo(
    () =>
      new Fuse(actions, {
        keys: [
          "fields.Date",
          "fields.Type",
          "fields.StatusOfAccused",
          "fields.Category",
          "fields.Company",
          "fields.Country",
          "fields.Name",
          "fields.Location",
          "fields.geography.location.display_name",
          "summary.plaintext",
          "fields.CategoryName",
          "fields.TypeName",
          "fields.StatusOfAccusedName",
          "fields.countryName",
          "fields.companyName",
          ["fields", "Organising Groups"],
          "fields.organisingGroupName",
        ],
        threshold: 0.01,
        ignoreLocation: true,
        includeMatches: true,
        minMatchCharLength: 2,
        findAllMatches: true,
        shouldSort: false,
        useExtendedSearch: true,
      }),
    [actions]
  );

  const defaults = {
    updateMatches: false,
    selectedYears,
    selectedTypes,
    selectedStatuses,
    selectedCategories,
    selectedCompanies,
    selectedCountries,
    selectedOrganisingGroups,
    filterText,
  };

  function filterActions(params: Partial<typeof defaults> = defaults) {
    const {
      selectedYears,
      selectedTypes,
      selectedStatuses,
      selectedCategories,
      selectedCompanies,
      selectedCountries,
      selectedOrganisingGroups,
      filterText,
    } = params;
    const expression: Fuse.Expression = { $and: [] };
    if (selectedYears?.length) {
      expression.$and!.push({
        $or: selectedYears.map((c) => ({
          "fields.Date": `'${c?.id}`,
        })),
      });
    }
    if (selectedTypes?.length) {
      expression.$and!.push({
        $or: selectedTypes.map((c) => ({
          "fields.Type": `'${c?.id}`,
        })),
      });
    }
    if (selectedStatuses?.length) {
      expression.$and!.push({
        $or: selectedStatuses.map((c) => ({
          "fields.StatusOfAccused": `'${c?.id}`,
        })),
      });
    }
    if (selectedCategories?.length) {
      expression.$and!.push({
        $or: selectedCategories.map((c) => ({
          "fields.Category": `'${c?.id}`,
        })),
      });
    }
    if (selectedCompanies?.length) {
      expression.$and!.push({
        $or: selectedCompanies.map((c) => ({ "fields.Company": `'${c?.id}` })),
      });
    }
    if (selectedCountries?.length) {
      expression.$and!.push({
        $or: selectedCountries.map((c) => ({ "fields.Country": `'${c?.id}` })),
      });
    }
    if (selectedOrganisingGroups?.length) {
      expression.$and!.push({
        $or: selectedOrganisingGroups.map((c) => ({
          $path: ["fields", "Organising Groups"],
          $val: `'${c?.id}`,
        })),
      });
    }
    if (filterText?.trim().length) {
      expression.$and!.push({
        $or: [
          { "fields.Name": `'"${filterText}"` },
          { "summary.plaintext": `'"${filterText}"` },
          { "fields.Location": `'"${filterText}"` },
          { "fields.geography.location.displayname": `'"${filterText}"` },
          { "fields.TypeName": `'"${filterText}"` },
          { "fields.StatusOfAccusedName": `'"${filterText}"` },
          { "fields.CategoryName": `'"${filterText}"` },
          { "fields.countryName": `'"${filterText}"` },
          { "fields.companyName": `'"${filterText}"` },
          { "fields.organisingGroupName": `'"${filterText}"` },
        ],
      });
    }

    return search.search(expression);
  }

  const filterActionCount = memoize(
    (params: Partial<typeof defaults> = defaults): number => {
      return filterActions(params).length;
    },
    (arg) => JSON.stringify(arg)
  );

  function updateFilteredActions() {
    const hasFilters = !!(
      filterText.length ||
      selectedOrganisingGroups.length ||
      selectedCountries.length ||
      selectedCompanies.length ||
      selectedCategories.length ||
      selectedYears.length ||
      selectedTypes.length ||
      selectedStatuses.length
    );
    if (!hasFilters) return actions;
    const results = filterActions();
    setMatches(results);
    return results.map((s) => s.item);
  }

  const filteredActions = useMemo(() => {
    return updateFilteredActions();
  }, [
    actions,
    search,
    hasFilters,
    filterText,
    selectedYears,
    selectedTypes,
    selectedStatuses,
    selectedCategories,
    selectedCompanies,
    selectedOrganisingGroups,
    selectedCountries,
  ]);

  useEffect(() => {
    if (hasFilters) {
      window.scroll({
        top: document.getElementById("static-header")?.offsetHeight || 100,
        behavior: "smooth",
      });
    }
  }, [hasFilters]);

  const relevantGroups = Array.from(
    new Set(
      filteredActions.reduce(
        (gs, a) => gs.concat(a.fields["Organising Groups"] || []),
        [] as string[]
      )
    )
  )
    .map((gid) => groups.find((G) => G.id === gid)!)
    .filter(Boolean);

  const UNION_DISPLAY_LIMIT = 3;
  const { makeContextualHref, returnHref } = useContextualRouting();
  const [selectedUnion, unionDialogKey] = useSelectedOrganisingGroup(
    groups || []
  );

  /**
   * Render
   */
  return (
    <FilterContext.Provider
      value={{
        matches,
        search: filterText,
        types: filteredTypes,
        statuses: filteredStatuses,
        years: filteredYears,
        categories: filteredCategoryNames,
        countries: filteredCountrySlugs,
        companies: filteredCompanyNames,
        hasFilters,
      }}
    >
      <OrganisingGroupDialog
        data={selectedUnion}
        onClose={() => {
          router.push(returnHref, undefined, { shallow: true, scroll: false });
        }}
      />
      <div className="flex flex-col lg:flex-row">
        <section className="relative bg-white flex-1 border-r-2 border-lightGrey border-solid lg:max-w-[50vw]">
          <div className="p-4 lg:p-5 xl:pl-7 flex flex-col flex-nowrap md:h-screen sticky top-5">
            <section className="flex-grow-0">
              <div className="flex flex-wrap w-full justify-between text-sm">
                <h3 className="text-base text-left text-lg left-0 font-bold mb-2 font-serif">
                  Filter by
                </h3>
                {hasFilters ? (
                  <div
                    className="cursor-pointer rounded-lg inline-block hover:text-lightGrey"
                    onClick={clearAllFilters}
                  >
                    <span className="font-mono text-darkGrey">
                      Clear all filters
                    </span>
                    &nbsp;
                    <span className="inline-block transform rotate-45 text-base">
                      +
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="relative flex flex-wrap justify-between w-full">
                <div className="filter-item flex-grow">
                  <Listbox
                    value={filteredYears}
                    onChange={(v) => toggleYear(v as any)}
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Button className={"w-full"}>
                          <FilterButton
                            label="Year"
                            selectionCount={selectedYears.length}
                            isOpen={open}
                          />
                        </Listbox.Button>
                        <Listbox.Options>
                          <div className="listbox-dropdown">
                            {years.map((year) => {
                              const isSelected = !!selectedYears.find(
                                (c) => c?.id === year.id
                              );
                              const countIfYouIncludeThis = !hasFilters
                                ? year.fields["Solidarity Actions"]?.length || 0
                                : filterActionCount({
                                    ...defaults,
                                    selectedYears: [...selectedYears, year],
                                  });
                              return (
                                <Listbox.Option
                                  key={year.id}
                                  value={year.fields.Name}
                                  disabled={
                                    !countIfYouIncludeThis && !isSelected
                                  }
                                >
                                  {(args) => (
                                    <FilterOption
                                      {...args}
                                      selected={isSelected}
                                      disabled={!countIfYouIncludeThis}
                                    >
                                      <span className="text-sm inline-block align-baseline">
                                        {year.fields.Name}
                                        {isSelected && (
                                          <img
                                            src="/images/icon-tick.svg"
                                            className="h-2 pl-3 pr-2 inline"
                                          />
                                        )}
                                      </span>
                                      <span className="align-baseline inline-block text-xs ml-auto pl-3">
                                        {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                        {countIfYouIncludeThis}
                                      </span>
                                    </FilterOption>
                                  )}
                                </Listbox.Option>
                              );
                            })}
                          </div>
                        </Listbox.Options>
                      </>
                    )}
                  </Listbox>
                </div>
                <div className="filter-item flex-grow mr-0 lg:mr-2">
                  <Listbox
                    value={filteredCountrySlugs}
                    onChange={(v) => toggleCountry(v as any)}
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Button className={"w-full"}>
                          <FilterButton
                            label="Location"
                            selectionCount={selectedCountries.length}
                            isOpen={open}
                          />
                        </Listbox.Button>
                        <Listbox.Options>
                          <div className="listbox-dropdown">
                            {countries.map((country) => {
                              const isSelected = !!selectedCountries.find(
                                (c) => c?.id === country.id
                              );

                              const numberOfSolidarityActionsInCountry =
                                country.fields["Solidarity Actions"]?.length ||
                                0;

                              return (
                                <Listbox.Option
                                  key={country.id}
                                  value={country.fields.Slug}
                                  disabled={
                                    !numberOfSolidarityActionsInCountry &&
                                    !isSelected
                                  }
                                >
                                  {(args) => (
                                    <FilterOption
                                      {...args}
                                      selected={isSelected}
                                      disabled={
                                        !numberOfSolidarityActionsInCountry
                                      }
                                    >
                                      <span
                                        aria-role="hidden"
                                        className="hidden"
                                      >
                                        {/* This allows type-ahead on the keyboard for the dropdown */}
                                        {country.fields.Name}
                                      </span>
                                      <span className="text-sm ml-1 inline-block">
                                        {country.fields.Name}
                                        {isSelected && (
                                          <img
                                            src="/images/icon-tick.svg"
                                            className="h-2 pl-3 pr-2 inline"
                                          />
                                        )}
                                      </span>
                                      <span className="inline-block align-baseline text-xs ml-auto pl-3">
                                        {numberOfSolidarityActionsInCountry}
                                      </span>
                                    </FilterOption>
                                  )}
                                </Listbox.Option>
                              );
                            })}
                          </div>
                        </Listbox.Options>
                      </>
                    )}
                  </Listbox>
                </div>
                <div className="filter-item flex-grow">
                  <Listbox
                    value={filteredTypes}
                    onChange={(v) => toggleType(v as any)}
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Button className={"w-full"}>
                          <FilterButton
                            label="Type"
                            selectionCount={selectedTypes.length}
                            isOpen={open}
                          />
                        </Listbox.Button>
                        <Listbox.Options>
                          <div className="listbox-dropdown">
                            {types.map((type) => {
                              const countIfYouIncludeThis = !hasFilters
                                ? type.fields["Solidarity Actions"]?.length || 0
                                : filterActionCount({
                                    ...defaults,
                                    selectedTypes: [...selectedTypes, type],
                                  });
                              const isSelected = !!selectedCategories.find(
                                (c) => c?.id === type.id
                              );
                              return (
                                <Listbox.Option
                                  key={type.id}
                                  value={type.fields.Name}
                                  disabled={
                                    !countIfYouIncludeThis && !isSelected
                                  }
                                >
                                  {(args) => {
                                    return (
                                      <FilterOption
                                        {...args}
                                        selected={isSelected}
                                        disabled={!countIfYouIncludeThis}
                                      >
                                        <span
                                          aria-role="hidden"
                                          className="hidden"
                                        >
                                          {/* This allows type-ahead on the keyboard for the dropdown */}
                                          {type.fields.Name}
                                        </span>
                                        <span className="text-sm inline-block align-baseline capitalize ml-1">
                                          {type.fields.Name}
                                          {isSelected && (
                                            <img
                                              src="/images/icon-tick.svg"
                                              className="h-2 pl-3 pr-2 inline"
                                            />
                                          )}
                                        </span>
                                        <span className="align-baseline inline-block text-xs ml-auto pl-3">
                                          {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                          {countIfYouIncludeThis}
                                        </span>
                                      </FilterOption>
                                    );
                                  }}
                                </Listbox.Option>
                              );
                            })}
                          </div>
                        </Listbox.Options>
                      </>
                    )}
                  </Listbox>
                </div>
                <div className="filter-item flex-grow">
                  <Listbox
                    value={filteredStatuses}
                    onChange={(v) => toggleStatus(v as any)}
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Button className={"w-full"}>
                          <FilterButton
                            label="Status"
                            selectionCount={selectedStatuses.length}
                            isOpen={open}
                          />
                        </Listbox.Button>
                        <Listbox.Options>
                          <div className="listbox-dropdown w-1/2 lg:w-full">
                            {statuses.map((status) => {
                              const isSelected = !!selectedStatuses.find(
                                (c) => c?.id === status.id
                              );
                              const countIfYouIncludeThis = !hasFilters
                                ? status.fields["Solidarity Actions"]?.length ||
                                  0
                                : filterActionCount({
                                    ...defaults,
                                    selectedStatuses: [
                                      ...selectedStatuses,
                                      status,
                                    ],
                                  });
                              return (
                                <Listbox.Option
                                  key={status.id}
                                  value={status.fields.Name}
                                  disabled={
                                    !countIfYouIncludeThis && !isSelected
                                  }
                                >
                                  {(args) => {
                                    return (
                                      <FilterOption
                                        {...args}
                                        selected={isSelected}
                                        disabled={!countIfYouIncludeThis}
                                      >
                                        <span className="text-sm inline-block align-baseline">
                                          {status.fields.Name}
                                          {isSelected && (
                                            <img
                                              src="/images/icon-tick.svg"
                                              className="h-2 pl-3 pr-2 inline"
                                            />
                                          )}
                                        </span>
                                        <span className="align-baseline inline-block text-xs ml-auto pl-3">
                                          {/* {pluralize('action', countIfYouIncludeThis, true)} */}
                                          {countIfYouIncludeThis}
                                        </span>
                                      </FilterOption>
                                    );
                                  }}
                                </Listbox.Option>
                              );
                            })}
                          </div>
                        </Listbox.Options>
                      </>
                    )}
                  </Listbox>
                </div>
              </div>
              <div className="search-box flex-grow items-center w-full">
                <img
                  src="/images/icon-search.svg"
                  className="h-2 absolute pl-3 pr-2"
                />
                <input
                  placeholder={
                    "Search by region, state, country or type of case"
                  }
                  type="search"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value.trimStart())}
                  className="px-30px py-2 border-2 border-gray-300 text-sm font-normal font-mono w-full"
                />
              </div>
            </section>
            <section className="w-full flex-grow h-[40vh] md:h-auto">
              <Map
                data={JSON.parse(JSON.stringify(filteredActions))}
                onSelectCountry={(iso2) => {
                  const countrySlug = countries.find(
                    (c) => c.fields.countryCode === iso2
                  )?.fields.Slug;
                  if (countrySlug) {
                    toggleCountry(countrySlug);
                  }
                }}
              />
            </section>
            <section className="pt-1 flex-grow-0 w-full">
              <h3 className="text-base text-left w-full font-semibold">
                Select year
              </h3>
              <CumulativeMovementChart
                data={filteredActions}
                onSelectYear={(year) => scrollToYear(router, year)}
              />
            </section>
          </div>
        </section>

        <section className="p-4 lg:p-5 xl:pr-7 space-y-4 flex-1">
          <h2 className="text-6xl font-identity">
            {pluralize("case", filteredActions.length, true)}
          </h2>

          {!!relevantGroups.length && hasFilters && (
            <article>
              <h3 className="text-3xl font-light font-identity">
                Related groups
              </h3>
              <ul className="list space-y-1 my-3">
                <Disclosure>
                  {({ open }) => (
                    <>
                      {relevantGroups
                        .slice(0, open ? 1000 : UNION_DISPLAY_LIMIT)
                        .map((union) => (
                          <Link
                            href={makeContextualHref({
                              [unionDialogKey]: union.id,
                            })}
                            as={groupUrl(union)}
                            shallow
                            key={union.id}
                          >
                            <li className="space-x-1">
                              <span className="link">{union.fields.Name}</span>
                              <span>
                                <span className="inline-block ml-2 text-gray-400 rounded-full text-xs">
                                  {union.fields.IsUnion
                                    ? "Union"
                                    : "Organising group"}{" "}
                                  in
                                </span>
                                &nbsp;
                                <span className="inline-block text-gray-400 rounded-full text-xs">
                                  {stringifyArray(
                                    union.geography.country.map((g) => g.name)
                                  )}
                                </span>
                              </span>
                            </li>
                          </Link>
                        ))}
                      {(relevantGroups.length || 0) > UNION_DISPLAY_LIMIT && (
                        <Disclosure.Button>
                          <div className="text-sm link px-2 my-2">
                            <span>
                              {open
                                ? "Show fewer"
                                : `Show ${
                                    relevantGroups.length - UNION_DISPLAY_LIMIT
                                  } more`}
                            </span>
                            <ChevronRightIcon
                              className={`${
                                open ? "-rotate-90" : "rotate-90"
                              } transform w-3 inline-block`}
                            />
                          </div>
                        </Disclosure.Button>
                      )}
                    </>
                  )}
                </Disclosure>
              </ul>
            </article>
          )}

          {selectedCategories
            .filter((c) => c?.summary?.html)
            .map((c) => (
              <article>
                <h3 className="text-3xl font-identity">
                  More info on {c.fields.Name}
                </h3>
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: c?.summary.html }}
                />
              </article>
            ))}

          {
            !!selectedCompanies
              .filter((c) => c?.summary?.html)
              .map((c) => (
                <article>
                  <h3 className="text-3xl font-identity">
                    More info on {c.fields.Name}
                  </h3>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: c.summary.html }}
                  />
                </article>
              ))
          }

          {
            !!selectedCountries
              .filter((c) => c?.summary?.html)
              .map((c) => (
                <article>
                  <h3 className="text-3xl font-identity">
                    More info on {c.fields.Name}
                  </h3>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: c.summary.html }}
                  />
                </article>
              ))
          }

          <div className="pb-1" />

          <SolidarityActionsList
            data={filteredActions}
            withDialog
            dialogProps={{
              cardProps: {
                withContext: true,
              },
            }}
          />

          <article>
            <p className="font-bold font-serif text-lg">
              Can you contribute more information to Crimes of Solidarity and
              Humanitarianism?
            </p>

            <div className="space-x-2">
              <Link href="/submit">
                <span className="button font-mono text-darkGrey hover:text-lightGrey">
                  Submit case
                </span>
              </Link>
              <a
                className="button font-mono text-darkGrey hover:text-lightGrey"
                href={`mailto:${projectStrings.email}`}
              >
                Contact us
              </a>
            </div>
          </article>
        </section>
      </div>
    </FilterContext.Provider>
  );
}
