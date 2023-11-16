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
    <figure className="quote-figure p-0 mt-8">
      <div className="relative flex flex-col gap-5 pl-8 py-2">
        <p className="text-foreground-light text-lg border-none" style={{ margin: 0, padding: 0 }}>
          {children}
        </p>
        {caption && img && (
          <div className="mt-4">
            <Avatar caption={caption} img={img} />
          </div>
        )}
        <div className="absolute rounded-full w-1 h-full inset-0 right-auto bg-brand" />
      </div>
    </figure>
  )
}
