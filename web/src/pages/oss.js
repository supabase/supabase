import React from 'react'
import Layout from '@theme/Layout'
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import stargazers from '../data/stars/stargazers.json'
import GithubCard from '../components/GithubCard'
import { repos } from '../data/github'

export default function Oss() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <section className={'section-lg'}>
        <div className="container">
          <div className={'row '}>
            <div className="col">
              <h2 className="with-underline">Open source</h2>
              <p className="">
                Supabase is an opensource company. Follow us on{' '}
                <a href="https://github.com/supabase">GitHub</a>.
              </p>
            </div>
          </div>

          <div className={'row'}>
            <div className="col">
              <div className="card" style={{ height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart
                    width={600}
                    height={400}
                    data={stargazers}
                    margin={{
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="@supabase/schemas"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                    <Area
                      type="monotone"
                      dataKey="@supabase/postgrest-js"
                      stackId="1"
                      stroke="#EAB7B7"
                      fill="#F27272"
                    />
                    <Area
                      type="monotone"
                      dataKey="@supabase/supabase"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="@supabase/realtime"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OSS */}
      <section className={'section-lg'}>
        <div className="container">
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
const CustomTooltip = props => {
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
