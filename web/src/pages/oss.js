import React from 'react'
import { Octokit } from "@octokit/core"
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import sponsors from '../data/sponsors.json'
import maintainers from '../data/maintainers.json'
import GithubCard from '../components/GithubCard'

import Sponsors from '../components/Sponsors'

export default function Oss() {
  const octokit = new Octokit();

  const [activePill, setActivePill] = React.useState('All')
  const [repos, setRepos] = React.useState([])

  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  const maintainerTags = maintainers
    .reduce((acc, x) => acc.concat(x.tags), []) // get all tags
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort((a, b) => a.localeCompare(b)) // alphabetical
  const maintainerPills = ['All'].concat(maintainerTags)

  React.useEffect(async () => {
    const reposResponse = await octokit.request("GET /orgs/{org}/repos", {
      org: "supabase",
      type: "public",
      per_page: 6,
      page: 1
    });

    setRepos(reposResponse.data.filter((r) => !!r.stargazers_count).sort((a, b) => b.stargazers_count - a.stargazers_count))
  })

  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <section className={'section-lg'}>
        <div className="container">
          <div className={'row'}>
            <div className="col">
              <h2 className="with-underline">Open source</h2>
              <p className="">
                Supabase is an open source company, supporting existing open source tools and
                communities wherever possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className={'section-lg'}>
        <div className="container">
          <h2 className="with-underline">Sponsors</h2>
          <Sponsors />
        </div>
      </section>

      {/* Core */}
      <section className={'section-lg'}>
        <div className="container">
          <h2>Community Maintainers</h2>

          <ul class="pills">
            {maintainerPills.map((x) => (
              <li
                key={x}
                class={`pills__item ${activePill == x ? 'pills__item--active' : ''}`}
                onClick={() => setActivePill(x)}
              >
                {x}
              </li>
            ))}
          </ul>

          <div className="row is-multiline">
            {maintainers
              .filter((x) => activePill == 'All' || x.tags.includes(activePill))
              .sort((a, b) => a.handle.localeCompare(b.handle))
              .map((x, idx) => (
                <div className={'col col--4'} key={idx}>
                  <a className="card" href={`https://github.com/${x.handle}`} target="_blank">
                    <div className="card__body">
                      <div className="avatar">
                        <div className="avatar__photo-link avatar__photo avatar__photo--lg">
                          <img alt={x.handle} src={`https://github.com/${x.handle}.png`} />
                        </div>
                        <div className="avatar__intro">
                          <h4 className="avatar__name">@{x.handle}</h4>
                          <small className="avatar__subtitle">{x.description}</small>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* OSS */}
      <section className={'section-lg'}>
        <div className="container">
          <h2>Repositories</h2>
          <div className="row is-multiline">
            {repos.length < 1 && <div>
            </div>}
            {repos.length >= 1 && repos.map((props, idx) => (
              <div className={'col col--6'}>
                <GithubCard
                  key={idx}
                  title={props.name}
                  description={props.description}
                  href={props.html_url}
                  stars={props.stargazers_count}
                  handle={props.full_name}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
