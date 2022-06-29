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
    <figure className="border border-gray-100 p-8 dark:border-gray-600">
      <div className="flex flex-col gap-5">
        <blockquote className="text-scale-1200 mb-4 border-none" style={{ margin: 0, padding: 0 }}>
          {children}
        </blockquote>
        <Avatar caption={caption} img={img} />
      </div>
    </figure>
  )
}
