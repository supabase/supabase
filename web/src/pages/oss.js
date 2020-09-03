import React from 'react'
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import sponsors from '../data/sponsors.json'
import maintainers from '../data/maintainers.json'
import GithubCard from '../components/GithubCard'
import { repos } from '../data/github'

export default function Oss() {
  const [activePill, setActivePill] = React.useState('All')
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  const maintainerTags = maintainers
    .reduce((acc, x) => acc.concat(x.tags), []) // get all tags
    .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
    .sort((a, b) => a.localeCompare(b)) // alphabetical
  const maintainerPills = ['All'].concat(maintainerTags)
  const tiers = [
    {
      tier_name: '$5,000 a month',
      heading: 'Enterprise: $5,000 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$5,000 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
    {
      tier_name: '$2,500 a month',
      heading: 'Agency: $2,500 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$2,500 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
    {
      tier_name: '$1,000 a month',
      heading: 'Startup: $1,000 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$1,000 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
    {
      tier_name: '$49 a month',
      heading: 'Evangelist: $49 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$49 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
    {
      tier_name: '$19 a month',
      heading: 'Supporter: $19 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$19 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
    {
      tier_name: '$5 a month',
      heading: 'Contributor: $5 per month',
      transactions: sponsors.filter(
        (x) =>
          x.transactions[0]?.tier_name == '$5 a month' && x.transactions[0]?.status == 'settled'
      ),
    },
  ]

  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <section className={'section-lg'}>
        <div className="container">
          <div className={'row '}>
            <div className="col">
              <h2 className="with-underline">Open source</h2>
              <p className="">
                Supabase is an opensource company, supporting existing open source tools and
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
          {tiers.map(
            (t) =>
              !!t.transactions.length && (
                <>
                  <h4 className="">{t.heading}</h4>
                  <div className="row is-multiline">
                    {t.transactions.map((x) => (
                      <div className="col col--3" key={x.sponsor_handle}>
                        <a className="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                          <img
                            className="avatar__photo avatar__photo--sm"
                            src={`https://github.com/${x.sponsor_handle}.png`}
                          />
                          <div className="avatar__intro">
                            <h5 className="avatar__name">{x.sponsor_handle}</h5>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                  <br />
                </>
              )
          )}
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
              .sort((a,b) => a.handle.localeCompare(b.handle))
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
            {repos.map((props, idx) => (
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

function ContributorCard({ title, description, href, stars, handle }) {
  return (
    <a className={'card'} href={href} style={{ height: '100%' }}>
      <div className="card__body">
        <h4 style={styles.h4} style={{ margin: 0 }}>
          {title.toUpperCase()}
        </h4>
        <small>{description}</small>
      </div>
      <hr style={styles.hr} />
      <div style={styles.cardBase}>
        <div>@{handle}</div>
        <div>{stars} ★</div>
      </div>
    </a>
  )
}

const styles = {
  hr: {
    margin: '15px 0 10px 0',
  },
  h3: {
    margin: 0,
    textTransform: 'capitalize',
  },
  cardBase: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '0 15px 10px 15px',
    fontSize: '0.8em',
  },
}
