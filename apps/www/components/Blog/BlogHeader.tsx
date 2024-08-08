import React from 'react'

interface Props {
  title: string
}

export default function BlogHeader({ title }: Props) {
  return (
    <div className="overflow-hidden border-b bg-surface-100 pt-4 pb-4 border-control">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20">
        <div className="mx-auto">
          <h1>
            <span className="text-3xl">{title}</span>
          </h1>
        </div>
      </div>
    </div>
  )
}
