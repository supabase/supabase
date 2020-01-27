import React from 'react'
import Layout from '@theme/Layout'
import { AreaChart, Area, Tooltip, XAxis, ResponsiveContainer } from 'recharts'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import monorepo_history from '../data/stars/monorepo_history.json'
import realtime_history from '../data/stars/realtime_history.json'
import schemas_history from '../data/stars/schemas_history.json'

const history = []
  .concat(monorepo_history)
  .concat(realtime_history)
  .concat(schemas_history)

// const now = new Date()
// var data = []
// // console.log('history', history)
// for (var d = new Date(2019, 10, 1); d <= now; d.setDate(d.getDate() + 1)) {
//   let dateString = d.toISOString().split('T')[0]
//   data.push({
//     name: dateString,
//     '@supabase/monorepo': 1,
//     '@supabase/realtime': 2,
//     '@supabase/schemas': 3,
//   })
// }

// this gives an object with dates as keys
const groups = history.reduce((groups, event) => {
  const date = event.starred_at.split('T')[0]
  if (!groups[date]) {
    groups[date] = []
  }
  groups[date].push(event)
  return groups
}, {})

var tally = {
  '@supabase/monorepo': 0,
  '@supabase/realtime': 0,
  '@supabase/schemas': 0,
}
const data = Object.keys(groups)
  .sort((a, b) => a > b)
  .map(date => {
    let monorepo = groups[date].filter(x => x.repo === '@supabase/monorepo').length
    let realtime = groups[date].filter(x => x.repo === '@supabase/realtime').length
    let schemas = groups[date].filter(x => x.repo === '@supabase/schemas').length
    tally['@supabase/monorepo'] += monorepo
    tally['@supabase/realtime'] += realtime
    tally['@supabase/schemas'] += schemas
    return {
      name: date,
      '@supabase/monorepo': tally['@supabase/monorepo'],
      '@supabase/realtime': tally['@supabase/realtime'],
      '@supabase/schemas': tally['@supabase/schemas'],
    }
  })

// console.log('groupArrays', groupArrays)

export default function Oss() {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <Layout title={`${siteConfig.title}`} description={siteConfig.tagline}>
      <section className={'section-lg'}>
        <div className="container">
          <div className={'row'}>
            <div className="col col--8 col--offset-2">
              <h3>Github Stars</h3>
              <div className="card" style={{ height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart
                    width={600}
                    height={400}
                    data={data}
                    margin={{
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    {/* Need this to make the Tooltip show the correct "name"? */}
                    <XAxis dataKey="name" style={{ display: 'none' }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="@supabase/schemas"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                    <Area
                      type="monotone"
                      dataKey="@supabase/monorepo"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="@supabase/realtime"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
