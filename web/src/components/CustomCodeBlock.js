import 'react-perfect-scrollbar/dist/css/styles.css'
import React, { useState } from 'react'
import CodeBlock from '@theme/CodeBlock'
import PerfectScrollbar from 'react-perfect-scrollbar'

export default function CustomCodeBlock({ header, js, jsHighlight, response }) {
  const [showResponse, toggleResponse] = useState(false)

  let wrapperClass = ''
  if (header) wrapperClass += ' code-with-header'
  if (response) wrapperClass += ' code-with-response'

  return (
    <>
      <div className={wrapperClass}>
        {header && <div className="code-header">{header}</div>}
        <PerfectScrollbar>
          <CodeBlock metastring={jsHighlight}>{js}</CodeBlock>
        </PerfectScrollbar>
      </div>
      {response && (
        <>
          <div className={'code-with-header'}>
            <a
              className="code-header has-hover-pointer"
              style={showResponse ? styles.responseShown : styles.responseHidden}
              onClick={() => toggleResponse(!showResponse)}
            >
              {showResponse ? 'Hide' : 'Show'} Response
            </a>
            {showResponse && <CodeBlock>{response}</CodeBlock>}
          </div>
        </>
      )}
    </>
  )
}

const styles = {
  responseShown: {
    textAlign: 'right',
    display: 'block',
    borderRadius: '0',
    color: 'var(--custom-primary)',
    borderTop: '1px solid #444'
  },
  responseHidden: {
    textAlign: 'right',
    display: 'block',
    borderBottom: 'none',
    borderRadius: '0 0 4px 4px',
    borderTop: '1px solid #444',
    color: '#ccc'
  },
}
