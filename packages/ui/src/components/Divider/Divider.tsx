import React from 'react'

interface Props {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Divider({ children, style }: Props) {
  return (
    <div role="separator" style={style}>
      {children && <span>{children}</span>}
    </div>
  )
}
