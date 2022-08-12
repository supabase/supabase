import React from 'react'

export default function GithubCard({
  title,
  description,
  href,
  stars,
  handle,
}) {
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
