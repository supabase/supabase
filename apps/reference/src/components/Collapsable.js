import React from 'react'

export default function Collapsable({ title, children }) {
  return (
    <details className="Collapsable">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  )
}
