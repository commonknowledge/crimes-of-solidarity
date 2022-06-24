import { getLiveSolidarityActions } from "../data/solidarityAction";
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
import env from "env-var";
import { GetStaticProps } from "next";
import PageLayout from "../components/PageLayout";
import { getCompanies } from "../data/company";
import { getCategories } from "../data/category";
import { getTypes } from "../data/type";
import { getStatuses } from "../data/status";
import { getCountries } from "../data/country";
import { SolidarityActionsTimeline } from "../components/Timeline";
import { getOrganisingGroups } from "../data/organisingGroup";
import { createContext } from "react";

type PageProps = {
  actions: SolidarityAction[];
  companies: Company[];
  categories: Category[];
  types: Type[];
  statuses: Status[];
  countries: Country[];
  groups: OrganisingGroup[];
};

export const ActionsContext = createContext<PageProps>({
  actions: [],
  companies: [],
  categories: [],
  types: [],
  statuses: [],
  countries: [],
  groups: [],
});

export default function Page({
  actions,
  companies,
  categories,
  countries,
  groups,
  types,
  statuses,
}: PageProps) {
  //construct years from actions
  const yearsCollection = {};

  actions.forEach((action) => {
    const year: string = action.fields.Date.slice(0, 4);
    if (yearsCollection[year]) {
      yearsCollection[year].fields["Solidarity Actions"].push(action.id);
    } else {
      yearsCollection[year] = {
        id: year,
        fields: {
          Name: year,
          "Solidarity Actions": [action.id],
        },
      };
    }
  });

  const years: Year[] = [];

  for (let year in yearsCollection) {
    years.push(yearsCollection[year]);
  }

  years.reverse();

  return (
    <PageLayout>
      {/* <ActionsContext.Provider value={{
        actions,
        companies,
        categories,
        countries,
        groups,
      }}> */}
      <SolidarityActionsTimeline
        actions={actions}
        companies={companies}
        categories={categories}
        countries={countries}
        groups={groups}
        types={types}
        statuses={statuses}
        years={years}
      />
      {/* </ActionsContext.Provider> */}
    </PageLayout>
  );
}

export const getStaticProps: GetStaticProps<PageProps, {}> = async (
  context
) => {
  return {
    props: {
      actions: await getLiveSolidarityActions(),
      companies: await getCompanies(),
      categories: await getCategories(),
      countries: await getCountries(),
      types: await getTypes(),
      groups: await getOrganisingGroups(),
      statuses: await getStatuses(),
    },
    revalidate: env
      .get("PAGE_TTL")
      .default(env.get("NODE_ENV").asString() === "production" ? 60 : 5)
      .asInt(), // In seconds
  };
};
