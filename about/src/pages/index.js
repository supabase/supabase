import React, { useState } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

export default function Home() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  
  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <main className="HomePage">
        {/* HEADER */}
        <header className={clsx('hero full', styles.heroBanner)}>
          <div className="container">
            <div className="row">
              <div className="col col--5">
                <h2 className="hero__title">{siteConfig.tagline}</h2>
                <p className="hero__subtitle">
                  Supabase is the open source Firebase alternative.
                </p>
                <div>
                  <Link
                    className={clsx(
                      'button hero--button button--md button--secondary button--outline responsive-button',
                      styles.button
                    )}
                    to={useBaseUrl('/handbook')}
                    style={{ marginLeft: 0, marginTop: 10 }}
                  >
                    Learn More
                  </Link>
                  <Link
                    className={clsx(
                      'button hero--button button--md button--primary responsive-button',
                      styles.button
                    )}
                    to={'https://boards.greenhouse.io/supabase'}
                    style={{ marginTop: 10 }}
                  >
                    Join the team →
                  </Link>
                </div>
              </div>
              <div className="col col--7">
                {/* Example */}
              </div>
            </div>
          </div>
        </header>

        {/* <section
          style={{
            padding: 30,
          }}
          className="hero is--dark"
        >
          <div
            className="container "
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <img src="/img/yc-gray.png" alt="Y Combinator" width="50" />
            <p
              style={{
                fontWeight: 'bold',
                padding: '0px 20px',
                margin: 0,
                display: 'inline-block',
              }}
            >
              Backed by Y Combinator
            </p>
          </div>
        </section> */}

      </main>
    </Layout>
  )
}