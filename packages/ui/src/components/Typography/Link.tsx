import React from 'react'

interface Props {
  children?: React.ReactNode
  target?: '_blank' | '_self' | '_parent' | '_top' | 'framename'
  href?: string
  className?: string
  style?: React.CSSProperties
  onClick?: any
}

function Link({ children, target = '_blank', href, onClick, style }: Props) {
  return (
    <a onClick={onClick} href={href} target={target} rel="noopener noreferrer" style={style}>
      {children}
    </a>
  )
}

export default Link
