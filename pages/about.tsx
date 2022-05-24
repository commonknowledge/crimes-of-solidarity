import { getSingleStaticPage } from "../data/staticPage";
import { StaticPage } from "../data/types";
import { NextSeo } from "next-seo";
import env from "env-var";
import { GetStaticProps } from "next";
import PageLayout from "../components/PageLayout";
import ErrorPage from "./404";
import { projectStrings } from "../data/site";

type PageProps = { article: StaticPage | null; errorMessage?: string };
type PageParams = { slug: string[] };

export default function Page({ article, errorMessage }: PageProps) {
  if (!article) return <ErrorPage message={errorMessage} />;

  return (
    <PageLayout>
      <NextSeo
        title={article.fields.Title}
        description={article.fields.Summary}
        openGraph={{
          title: article.fields.Title,
          description: article.fields.Summary,
        }}
      />

      <section className="content-wrapper py-5 mt-60px">
        <article className="space-y-2">
          <h1 className="font-identity text-8xl pb-3">
            {article.fields.Title}
          </h1>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            <section
              className="prose md:col-span-2 font-serif"
              dangerouslySetInnerHTML={{ __html: article.body.html }}
            />
            <div className="space-y-5">
              <section className="space-y-3">
                <h2 className="font-semibold font-serif text-lg">Research</h2>
                <p>
                  <a
                    href="https://www.sheffield.ac.uk/socstudies/people/academic-staff/lucy-mayblin"
                    className="font-mono font-normal underline text-darkGrey"
                  >
                    Lucy Mablin
                  </a>
                </p>
                <h2 className="font-semibold font-serif text-lg">Website</h2>
                <p>
                  <a
                    href="https://commonknowledge.coop"
                    className="font-mono font-normal underline text-darkGrey"
                  >
                    Common Knowledge
                  </a>
                </p>
              </section>
              <section className="space-y-3">
                <h2 className="font-semibold font-serif text-lg">Contact</h2>
                <p>
                  <a
                    className="font-mono font-normal underline text-darkGrey"
                    href={`mailto:${projectStrings.email}`}
                  >
                    Email
                  </a>
                </p>
                <p>
                  <a
                    className="font-mono font-normal underline text-darkGrey"
                    href={`https://twitter.com/${projectStrings.twitterHandle}`}
                  >
                    Twitter
                  </a>
                </p>
                <p>
                  <a
                    className="font-mono font-normal underline text-darkGrey"
                    href={projectStrings.github}
                  >
                    GitHub
                  </a>
                </p>
              </section>
              <section className="space-y-3">
                <h2 className="font-semibold font-serif text-lg">Credits</h2>
                <p className="font-mono font-normal text-darkGrey">
                  No need to talk to users, just base it on the space calculator
                  we want to see more charts make sure to include in your
                  wheelhouse.
                </p>
              </section>
            </div>
          </div>
        </article>
      </section>
    </PageLayout>
  );
}

export const getStaticProps: GetStaticProps<PageProps, PageParams> =
  async () => {
    let article;
    let errorMessage = "";
    try {
      article = (await getSingleStaticPage("about")) || null;
    } catch (e) {
      console.error("No article was found", e);
      article = null;
      errorMessage = e.toString();
    }

    return {
      props: {
        article,
        errorMessage,
      },
      revalidate: env
        .get("PAGE_TTL")
        .default(env.get("NODE_ENV").asString() === "production" ? 60 : 5)
        .asInt(), // In seconds
    };
  };
