import Link from "next/link";
import { StaticPage, MenuItem } from "../data/types";
import qs from "query-string";
import useSWR from "swr";
import { doNotFetch } from "../utils/swr";
import { LinksData } from "../pages/api/links";
import cx from "classnames";
import useScrollPosition from "@react-hook/window-scroll";
import { useRef } from "react";

export default function PageLayout({ children }: { children: any }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main>{children}</main>

      <Footer />
    </div>
  );
}

const submitClasses = " bg-lightBlue";

function Header({}: {}) {
  const { data } = useSWR<{ headerLinks: MenuItem[] }>(
    "/api/links?placement=Header",
    {
      // Data should have been loaded by _app.tsx already,
      ...doNotFetch(),
    }
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const scrollY = useScrollPosition(60 /*fps*/);
  const isFloating = scrollY > (headerRef.current?.clientHeight || 100) * 0.75;

  return (
    <>
      <header
        className="py-5 bg-white space-y-2"
        ref={headerRef}
        id="static-header"
      >
        <div className="content-wrapper">
          <div className="flex justify-between sm:space-x-4 sm:space-y-0 items-top">
            <div className="leading-none text-4xl lg:text-[4vw] w-2/5 font-identity cursor-pointer hover:text-activeBlue flex-shrink-0 ">
              <Link href="/">Crimes of Solidarity and Humanitarianism</Link>
            </div>
            <p className=" mt-0 leading-normal sm:leading-tight text-xl xl:text-2xl sm:w-1/2 block text-200 max-w-6/12 font-bold font-serif">
              Documenting legal cases against people helping irregular migrants,
              known as crimes of solidarity and humanitarianism.
            </p>
          </div>
        </div>
      </header>
      <nav
        className="top-0 sticky z-40 py-3 bg-white border-b-2 border-lightGrey border-solid"
        id="sticky-header"
      >
        <div className="text-sm md:text-base content-wrapper w-full flex flex-row flex-wrap justify-start -mx-1 space-x-1 md:-mx-2 md:space-x-3 items-center">
          {data?.headerLinks?.map?.((link, i) => (
            <a
              href={link.fields.url}
              key={link.fields.url}
              className={`order-last md:order-1 no-underline`}
            >
              <span
                className={`nav-link text-darkGrey tracking-tighter font-mono ${
                  link.fields.url == "/submit" ? submitClasses : ""
                }`}
              >
                {link.fields.label}
              </span>
            </a>
          ))}
          <div
            className={cx(
              isFloating
                ? "opacity-100 max-w-6xl translate-x-0"
                : "opacity-0 translate-x-2",
              "hidden md:block transform ml-auto duration-200 transition-all leading-none text-xl lg:text-4xl font-identity cursor-pointer hover:text-activeBlue flex-shrink-0 order-1 md:order-last"
            )}
            style={{ marginLeft: "auto" }}
          >
            <Link href="/">Crimes of Solidarity and Humanitarianism</Link>
          </div>
        </div>
      </nav>
      <div id="portal-node" />
    </>
  );
}

function Footer({}: {}) {
  const { data } = useSWR<{ footerLinks: MenuItem[] }>(
    "/api/links?placement=Header",
    {
      // Data should have been loaded by _app.tsx already,
      ...doNotFetch(),
    }
  );

  return (
    <footer className="mt-auto bg-white text-sm border-t-2 border-lightGrey border-solid">
      <div className="content-wrapper py-5 md:py-6 space-y-4 flex flex-col md:flex-row justify-between items-start align-top">
        <div className="space-y-4 flex justify-between flex-grow">
          <nav className="inline-flex flex-wrap -mx-1 md:-mx-2">
            {data?.footerLinks?.map?.((link, i) => (
              <a
                href={link.fields.url}
                key={link.fields.url}
                className={"mx-30px"}
              >
                <span
                  className={`nav-link font-mono text-darkGrey ${
                    link.fields.url == "/submit" ? submitClasses : ""
                  }`}
                >
                  {link.fields.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="inline self-center justify-self-end font-mono mt-0 text-darkGrey">
            Site by{" "}
            <a className="link" href="https://commonknowledge.coop">
              Common Knowledge
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
