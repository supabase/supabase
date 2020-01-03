import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

const features = [
  {
    title: <>Chat apps</>,
    imageUrl: "",
    description: (
      <>Build a realtime chat application using PostgreSQL and Expo.</>
    ),
    href: "/docs/guides/examples"
  },
  {
    title: <>Realtime dashboards</>,
    imageUrl: "",
    description: <>Get live analytics using PostgreSQL and D3.js.</>,
    href: "/docs/guides/examples"
  },
  {
    title: <>Event sourcing</>,
    imageUrl: "",
    description: (
      <>Log all your database changes to an immutable logging system.</>
    ),
    href: "/docs/guides/examples"
  }
];

function Feature({ imageUrl, title, description, href }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames("col", styles.feature)}>
      <a className={classnames("card", styles.featureCard)} href={href}>
        <div className="card__body">
          {imgUrl && (
            <div className="">
              <img className={styles.featureImage} src={imgUrl} alt={title} />
            </div>
          )}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </a>
    </div>
  );
}
function HowCard({ title, heading, description }) {
  return (
    <div className={classnames("col", styles.howCard)}>
      <div className="">
        <h3>{title}</h3>
        <h4>{heading}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}


function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <header className={classnames("hero shadow--md", styles.heroBanner)}>
        <div className="container text--center">
          <h2 className="hero__title">{siteConfig.tagline}</h2>
          <p className="hero__subtitle">
            Add a Realtime API to your PostgreSQL database without a single line of code.
          </p>
          <div>
            {/* <img
              src="/img/hero.png"
              alt="Supabase"
              className={classnames(styles.heroImage)}
            /> */}
          </div>
        </div>
      </header>

      <div className={classnames("container text--center")}>
        <Link
          className={classnames(
            "button button--outline button--md button--secondary",
            styles.button
          )}
          to={useBaseUrl("docs/about")}
        >
          Learn More
        </Link>
        <Link
          className={classnames(
            "button button--outline button--md button--primary",
            styles.button
          )}
          to={useBaseUrl("docs/about")}
        >
          Get Started
        </Link>
      </div>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <h2 className="with-underline">Use Cases</h2>
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
        <section className={styles.features}>
          <div className="container">
            <h2 className="with-underline">How it works</h2>
            <div className="row">
              <HowCard
                title="1."
                heading="Connect Supabase to PostgreSQL"
                description={
                  <>
                    Login to Supabase to connect to your your existing
                    PostgreSQL database.
                  </>
                }
              />
              <HowCard
                title="2."
                heading="@todo"
                description={
                  <>
                    We introspect your database and provide an instant realtime
                    API.
                  </>
                }
              />
              <HowCard
                title="3."
                heading="@todo"
                description={<>@todo</>}
              />
            </div>
          </div>
        </section>

        <section
          style={{ marginTop: 40, padding: 20 }}
          className="hero is--dark"
        >
          <div className="container text--right">
            <div className="">
              <strong>Try Supabase for free</strong>
              <Link
                className={classnames(
                  "button button--outline button--md button--primary",
                  styles.button
                )}
                to={useBaseUrl("docs/about")}
              >
                GO
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
