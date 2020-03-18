import React from 'react'

export default function FunctionParam({ name, format, required, description }) {
  return (
    <div className="FunctionBlock">
      <h4>
        <code>
          {name}: {format}
          {required ? '' : '?'}
        </code>
      </h4>
      <p>{description || 'No description provided.'}</p>
    </div>
  )
}
