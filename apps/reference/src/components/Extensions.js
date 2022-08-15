import React, { useState } from 'react'
import extensions from '@site/src/data/extensions.json'

export default function Extensions() {
  const [filter, setFilter] = useState('')
  return (
    <>
      <div style={styles.inputContainer}>
        <input
          type="text"
          style={styles.input}
          placeholder="Filter"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="row" style={styles.row}>
        {extensions
          .filter((x) => x.name.indexOf(filter) >= 0)
          .map((extension) => (
            <div
              className={'col col--6'}
              key={extension.name}
              style={styles.column}
            >
              <div style={styles.card}>
                <h3>
                  <code style={styles.title}>{extension.name}</code>
                </h3>
                <p style={styles.description}>
                  {extension.comment.charAt(0).toUpperCase() +
                    extension.comment.slice(1)}
                </p>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}

const styles = {
  inputContainer: {
    marginBottom: '15px',
  },
  input: {
    border: '1px solid var(--ifm-panel-border-color)',
    borderRadius: 4,
    backgroundColor: 'var(--custom-background-color-diff)',
    color: 'var(--ifm-font-color-base)',
    margin: 0,
    padding: '6px 8px',
    width: 300,
  },
  column: {
    margin: '5px 0px',
    padding: '0px 5px',
  },
  card: {
    border: '1px solid var(--ifm-panel-border-color)',
    borderRadius: 5,
    padding: 8,
  },
  title: {
    margin: 0,
    fontSize: '0.9rem',
    border: '1px solid var(--ifm-panel-border-color)',
  },
  description: {
    fontSize: '0.8rem',
    margin: 0,
  },
}
