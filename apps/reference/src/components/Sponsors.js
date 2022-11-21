import React from 'react'
import sponsors from '@site/src/data/sponsors.json'

export default function Sponsors() {
  const tiers = [
    {
      tier_name: '$5,000 a month',
      heading: 'Enterprise: $5,000 per month',
      transactions: sponsors.filter((x) => x.tier == '$5,000 a month'),
    },
    {
      tier_name: '$2,500 a month',
      heading: 'Agency: $2,500 per month',
      transactions: sponsors.filter((x) => x.tier == '$2,500 a month'),
    },
    {
      tier_name: '$1,000 a month',
      heading: 'Startup: $1,000 per month',
      transactions: sponsors.filter((x) => x.tier == '$1,000 a month'),
    },
    {
      tier_name: '$49 a month',
      heading: 'Evangelist: $49 per month',
      transactions: sponsors.filter((x) => x.tier == '$49 a month'),
    },
    {
      tier_name: '$19 a month',
      heading: 'Supporter: $19 per month',
      transactions: sponsors.filter((x) => x.tier == '$19 a month'),
    },
    {
      tier_name: '$5 a month',
      heading: 'Contributor: $5 per month',
      transactions: sponsors.filter((x) => x.tier == '$5 a month'),
    },
  ]

  return (
    <div>
      {tiers.map(
        (t, index) =>
          !!t.transactions.length && (
            <div key={index}>
              <h4 className="">{t.heading}</h4>
              <div className="row is-multiline" style={{ paddingLeft: 15 }}>
                {t.transactions.map((x, index) => (
                  <div className="col col--4" key={index}>
                    <a
                      className="avatar"
                      href={`https://github.com/${x.sponsor}`}
                    >
                      <img
                        className="avatar__photo avatar__photo--sm"
                        src={`https://github.com/${x.sponsor}.png`}
                      />
                      <div className="avatar__intro">
                        <h5 className="avatar__name">{x.sponsor}</h5>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              <br />
            </div>
          )
      )}
    </div>
  )
}
