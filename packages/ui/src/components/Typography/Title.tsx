import React from 'react'

interface Props {
  className?: string
  level?: 1 | 2 | 3 | 4 | 5
  children: any
  style?: React.CSSProperties
}

function Title({ level = 1, children, style }: Props) {
  const CustomTag: any = `h${level}`

  return <CustomTag style={style}>{children}</CustomTag>
}

export default Title
