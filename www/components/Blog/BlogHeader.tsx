import React from 'react'

interface Props {
  title: string
}

export default function BlogHeader({ title }: Props) {
  return (
    <div className="bg-white dark:bg-dark-800 overflow-hidden pt-4 pb-4 border-b dark:border-gray-600">
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
