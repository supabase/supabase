import React from 'react'

export default function HowCard({
  title,
  description,
  featureTitle,
  features,
}) {
  return (
    <div className={'HowCard'}>
      <div className={'card'} style={styles.card}>
        <h4 style={styles.h4}>{title}</h4>
        <div className="card__body" style={styles.cardBase}>
          {description}
          <h5 style={styles.h5}>{featureTitle}</h5>
          <div style={styles.features}>
            {features.map((x, i) => (
              <div key={i}>
                <span>
                  <img src="/img/check.svg" alt="✔" style={styles.check} />
                </span>
                <span>{x}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  h4: {
    padding: 10,
    textAlign: 'center',
    borderBottom: '1px solid #000',
    margin: 0,
  },
  h5: {
    textTransform: 'uppercase',
    // opacity: 0.5,
    margin: '10px 0 0px 0',
    fontSize: '0.9em',
  },
  card: {
    border: '1px solid #000',
    boxShadow: 'none',
  },
  cardBase: {
    fontSize: '0.9em',
  },
  check: {
    width: 10,
    height: 10,
    marginRight: 10,
  },
}
