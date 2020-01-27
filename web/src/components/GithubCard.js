import React from 'react'

export default function GithubCard({ title, description, href, stars, handle }) {
  return (
    <div className={'col'}>
      <a className={'card'} href={href}>
        <div className="card__body">
          <h3 style={styles.h2}>{title}</h3>
          <small>{description}</small>
        </div>
        <hr style={styles.hr} />
        <div style={styles.cardBase}>
          <div>{handle}</div>
          <div>{stars} ★</div>
        </div>
      </a>
    </div>
  )
}

const styles = {
  hr: {
    margin: '15px 0 10px 0',
  },
  h3: {
    margin: 0,
  },
  cardBase: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '0 15px 10px 15px',
    fontSize: '0.8em',
  },
}
