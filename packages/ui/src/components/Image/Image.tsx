import React from 'react'

interface Props {
  source?: string
  style?: React.CSSProperties
  className?: string
  type?: 'rounded' | 'circle'
  alt?: string
  responsive?: boolean
}

export default function Image({ source, style, alt }: Props) {
  return <img src={source} style={style} alt={alt} />
}
