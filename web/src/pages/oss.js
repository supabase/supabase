import React from 'react'
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import sponsors from '../data/sponsors.json'
import GithubCard from '../components/GithubCard'
import { repos } from '../data/github'

export default function Oss() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  const level1 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$5 a month')
  const level2 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$19 a month')
  const level3 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$49 a month')
  const level4 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$1,000 a month')
  const level5 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$2,500 a month')
  const level6 = sponsors.filter((x) => x.transactions[0]?.tier_name == '$5,000 a month')

  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <section className={'section-lg'}>
        <div className="container">
          <div className={'row '}>
            <div className="col">
              <h2 className="with-underline">Open source</h2>
              <p className="">
                Supabase is an opensource company. Supabase tries to support existing open source
                tools and communities wherever possible.
              </p>
              <p className="">
                We also take sponsorship, which we then re-distribute to they community, either
                directly or by hiring employees to work on the tools we use. Open source is made
                better by all of our sponsors:
              </p>
            </div>
          </div>
          {level6.length && (
            <>
              <h3 className="">Enterprise: $5,000 per month</h3>
              <div class="row is-multiline">
                {level6.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </>
          )}
          {!!level5.length && (
            <>
              <h3 className="">Agency: $2,500 per month</h3>
              <div class="row is-multiline">
                {level5.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </>
          )}
          {!!level4.length && (
            <>
              <h3 className="">Startup: $1,000 per month</h3>
              <div class="row is-multiline">
                {level4.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </>
          )}
          {!!level3.length && (
            <>
              <h3 className="">Evangelist: $49 per month</h3>
              <div class="row is-multiline">
                {level3.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </>
          )}
          {level2.length && (
            <>
              <h3 className="">Supporter: $19 per month</h3>
              <div class="row is-multiline">
                {level2.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </>
          )}
          {level1.length && (
            <>
              <h3 className="">Contributor: $5 per month</h3>
              <div class="row is-multiline">
                {level1.map((x) => (
                  <div class="col col--3" key={x.sponsor_handle}>
                    <a class="avatar" href={`https://github.com/${x.sponsor_handle}`}>
                      <img
                        class="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor_handle}.png`}
                      />
                      <div class="avatar__intro">
                        <h5 class="avatar__name">{x.sponsor_handle}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
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

/**
 * Hijacked from recharts as the labels don't show up properly without the XAxis component
 */
const CustomTooltip = (props) => {
  const renderContent = () => {
    const { payload, separator, formatter, itemStyle, itemSorter } = props

    if (payload && payload.length) {
      const listStyle = { padding: 0, margin: 0 }
      const items = payload.sort(itemSorter).map((entry, i) => {
        const finalItemStyle = {
          display: 'block',
          paddingTop: 4,
          paddingBottom: 4,
          color: entry.color || '#000',
          ...itemStyle,
        }
        const hasName = entry.name
        const finalFormatter = entry.formatter || formatter || (() => {})
        return (
          <li className="recharts-tooltip-item" key={`tooltip-item-${i}`} style={finalItemStyle}>
            {hasName ? <span className="recharts-tooltip-item-name">{entry.name}</span> : null}
            {hasName ? <span className="recharts-tooltip-item-separator">{separator}</span> : null}
            <span className="recharts-tooltip-item-value">
              {finalFormatter ? finalFormatter(entry.value, entry.name, entry, i) : entry.value}
            </span>
            <span className="recharts-tooltip-item-unit">{entry.value || '0'}</span>
          </li>
        )
      })
      return (
        <ul className="recharts-tooltip-item-list" style={listStyle}>
          {items}
        </ul>
      )
    }
  }
  if (props.active) {
    const { labelStyle, label, wrapperStyle } = props
    const finalStyle = {
      margin: 0,
      padding: 10,
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      whiteSpace: 'nowrap',
      ...wrapperStyle,
    }
    const finalLabelStyle = {
      margin: 0,
      ...labelStyle,
    }
    let finalLabel = stargazers[label].name

    return (
      <div className="recharts-default-tooltip" style={finalStyle}>
        <p className="recharts-tooltip-label" style={finalLabelStyle}>
          {finalLabel}
        </p>
        {renderContent()}
      </div>
    )
  }

  return null
}
