import React, { useEffect } from 'react'
import { Octokit } from '@octokit/core'
import Layout from '~/layouts/Default'
import maintainers from '../data/maintainers.json'
import { menuItems } from '~/components/Navigation/Navigation.constants'
import GithubCard from '../components/GithubCard'
import Sponsors from '../components/Sponsors'

export default function Oss({ meta }) {
  const octokit = new Octokit()

  const [activePill, setActivePill] = React.useState('All')
  const [repos, setRepos] = React.useState([])

  const maintainerTags = maintainers
    .reduce((acc, x) => acc.concat(x.tags), []) // get all tags
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort((a, b) => a.localeCompare(b)) // alphabetical
  const maintainerPills = ['All'].concat(maintainerTags)

  useEffect(async () => {
    const reposResponse = await octokit.request('GET /orgs/{org}/repos', {
      org: 'supabase',
      type: 'public',
      per_page: 6,
      page: 1,
    })

    setRepos(
      reposResponse.data
        .filter((r) => !!r.stargazers_count)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
    )
  })

  return (
    <Layout meta={meta} menuItems={menuItems['docs']} currentPage="docs">
      <section className={'section-lg'}>
        <div className="container">
          <div className="flex items-center">
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
      <section>
        <div className="">
          <h2>Community Maintainers</h2>

          <ul className="flex gap-4 items-center overflow-auto p-0">
            {maintainerPills.map((x) => (
              <li
                key={x}
                className={`mx-4 rounded-sm inline-block p-2 cursor-pointer hover:text-brand-800 ${
                  activePill == x ? 'bg-gray-400 text-brand-800' : ''
                }`}
                onClick={() => setActivePill(x)}
              >
                {x}
              </li>
            ))}
          </ul>

          <div className="grid sm:grid-cols-3 grid-cols-3 gap-4">
            {maintainers
              .filter((x) => activePill == 'All' || x.tags.includes(activePill))
              .sort((a, b) => a.handle.localeCompare(b.handle))
              .map((x, idx) => (
                <div className="" key={idx}>
                  <a
                    className="shadow-none flex gap-4"
                    href={`https://github.com/${x.handle}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="grow bg-gray-200 p-4">
                      <div className="flex gap-4">
                        <img
                          className="rounded-full w-16 h-16 my-0"
                          alt={x.handle}
                          src={`https://github.com/${x.handle}.png`}
                        />
                        <div className="">
                          <h4 className="text-xl my-0">@{x.handle}</h4>
                          <span className="text-sm">{x.description}</span>
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
      <section>
        <div>
          <h2>Repositories</h2>
          <div className="grid gap-4">
            {repos.length < 1 && <div></div>}
            {repos.length >= 1 &&
              repos.map((props, idx) => (
                <div className="bg-gray-200 p-4" key={idx}>
                  <GithubCard
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
