import React from 'react'

interface Props {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Divider({ children, style, className }: Props) {
  return (
    <div role="separator" style={style} className={className}>
      {children && <span>{children}</span>}
    </div>
  )
}
