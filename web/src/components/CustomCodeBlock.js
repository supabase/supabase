import 'react-perfect-scrollbar/dist/css/styles.css'
import React from 'react'
import CodeBlock from '@theme/CodeBlock'
import PerfectScrollbar from 'react-perfect-scrollbar'

export default function CustomCodeBlock({ header, js }) {
  return (
    <div className={header ? 'code-with-header' : ''}>
      {header && <div className="code-header">{header}</div>}
      <PerfectScrollbar>
        <CodeBlock>{js}</CodeBlock>
      </PerfectScrollbar>
    </div>
  )
}
