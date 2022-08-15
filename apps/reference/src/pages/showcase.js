import React, { useEffect, useRef, useState } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Section from '../components/Section'
import Link from '@docusaurus/Link'

import showcase from '../data/showcase.json'

export default function Showcase() {
  const { siteConfig = {} } = useDocusaurusContext()
  const processedShowcase = showcase.sort((a, b) =>
    a.project_or_company.name.localeCompare(b.project_or_company.name)
  )

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Section title="Built with Supabase!" style="underline">
        {/* Open Source */}
        <ShowcaseSection showcase={processedShowcase} />
      </Section>

      {/* Add */}
      <Section title="Do you want to add your project?" style="underline">
        <p>
          <Link href="/docs/handbook/contributing">Learn how</Link> to add your
          project to our showcase.
        </p>
      </Section>
    </Layout>
  )
}

function ShowcaseSection({ showcase }) {
  return (
    <div className="row is-multiline">
      {/* Display showcase */}
      {showcase.map((v, i) => (
        <div className="col col--4" key={`${i}-${v.project_or_company.image}`}>
          <ShowcaseCard
            projectOrCompany={v.project_or_company}
            isOpenSource={v.is_open_source}
            publicRepo={v.public_repo}
          />
        </div>
      ))}
    </div>
  )
}

function ShowcaseCard({ projectOrCompany, isOpenSource, publicRepo }) {
  const spacedFooter =
    projectOrCompany.web_site && publicRepo && isOpenSource
      ? 'ShowcaseCard-Footer-Spaced'
      : null
  const button = (label, href) => (
    <a
      className="button button--secondary ShowcaseCard-Footer-Item"
      target="_blank"
      href={href}
    >
      {label}
    </a>
  )

  return (
    <div className="card card__body ShowcaseCard">
      <div className="ShowcaseCard-Content">
        <div className="ShowcaseCard-ImgContainer">
          <img
            className="ShowcaseCard-Img"
            src={`/img/showcase-logo/${projectOrCompany.image}`}
          />
        </div>

        <div className="ShowcaseCard-Text">
          <h3 className="">{projectOrCompany.name}</h3>
          <span className="ShowcaseCard-Tag">
            {isOpenSource ? '#OpenSource' : null}
          </span>
          <p>{projectOrCompany.description}</p>
        </div>
      </div>

      <div className={`${spacedFooter} ShowcaseCard-Footer`}>
        {projectOrCompany.web_site
          ? button('Web site', projectOrCompany.web_site)
          : null}
        {publicRepo && isOpenSource ? button('View repo', publicRepo) : null}
      </div>
    </div>
  )
}
