import React from 'react'

export interface Props {
  className?: string
  children: any
  style?: React.CSSProperties
  type?: 'default' | 'secondary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  mark?: boolean
  code?: boolean
  keyboard?: boolean
  underline?: boolean
  strikethrough?: boolean
  strong?: boolean
  small?: boolean
}

function Text({ children, style, mark, code, keyboard, strong }: Props) {
  if (code) return <code style={style}>{children}</code>
  if (mark) return <mark style={style}>{children}</mark>
  if (keyboard) return <kbd style={style}>{children}</kbd>
  if (strong) return <strong style={style}>{children}</strong>
  return <span style={style}>{children}</span>
}

export default Text
