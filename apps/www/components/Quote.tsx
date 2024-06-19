import React from 'react'
import Avatar from './Avatar'

interface Props {
  children: React.ReactNode
  caption: string
  img: string
}

export default function Quote(props: Props) {
  const { children, caption, img } = props

  return (
    <blockquote className="text-foreground">
      {children}
      {caption && img && <Avatar caption={caption} img={img} />}
    </blockquote>
  )
}
