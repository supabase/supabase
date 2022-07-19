import * as React from 'react'

type EmptyValueProps = {}

export const EmptyValue: React.FC<EmptyValueProps> = ({}) => {
  return (
    <span className="sb-grid-empty-value" style={{ opacity: 0.5 }}>
      EMPTY
    </span>
  )
}
