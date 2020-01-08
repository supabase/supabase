import React from 'react'
import classnames from 'classnames'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'
import SubscribeExample from '../../docs/snippets/SubscribeExample.mdx'

const features = [
  {
    title: <>Chat apps</>,
    imageUrl: '',
    description: <>Build a realtime chat application using PostgreSQL and Expo.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Realtime dashboards</>,
    imageUrl: '',
    description: <>Build live dashboards using PostgreSQL and D3.js.</>,
    href: '/docs/guides/examples',
  },
  {
    title: <>Event sourcing</>,
    imageUrl: '',
    description: <>Log all your database changes to an immutable logging system.</>,
    href: '/docs/guides/examples',
  },
]

function Feature({ imageUrl, title, description, href }) {
  const imgUrl = useBaseUrl(imageUrl)
  return (
    <div className={classnames('col', styles.feature)}>
      <a className={classnames('card', styles.featureCard)} href={href}>
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
  )
}

function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <header className={classnames('hero shadow--md', styles.heroBanner)}>
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
          <Link
            className={classnames(
              'button button--outline button--md button--secondary',
              styles.button
            )}
            to={useBaseUrl('docs/about')}
          >
            Learn More
          </Link>
          <Link
            className={classnames(
              'button button--outline button--md button--primary',
              styles.button
            )}
            to={'https://app.supabase.io'}
          >
            Request Early Access
          </Link>
        </div>
      </header>

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

        <section className={styles.forDevelopers}>
          <div className="container">
            <div class="row">
              <div class="col col--8 col--offset-2">
                <h2 className="with-underline text--center">For Developers</h2>
                <p className="text--center">
                  We're a bunch of developers, building tools for developers. Tools that we even use
                  ourselves. This means we are obsessed with solving your problems, because they
                  solve our problems too. We prioritise the intrinsic features first - features like
                  performance and simplicity. We believe that sometimes, doing less is better.
                </p>
              </div>
            </div>
            <div className="row">
              <div class="col col--9">
                <SubscribeExample />
              </div>
              <div class="col col--3">
                <button class="button button--block button--primary">Realtime</button>
                <button class="button button--block button--link">Get records</button>
                <button class="button button--block button--link">Create Records</button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 40, padding: 20 }} className="hero is--dark">
          <div className="container text--right">
            <div className="">
              <strong>Try Supabase for free</strong>
              <Link
                className={classnames(
                  'button button--outline button--md button--primary',
                  styles.button
                )}
                to={'https://app.supabase.io'}
              >
                GO
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Home
