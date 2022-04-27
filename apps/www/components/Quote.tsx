import { Space } from '@supabase/ui'
import React from 'react'

interface Props {
  children: React.ReactNode
  caption: string
  img: string
}

export default function Quote(props: Props) {
  const { children, caption, img } = props

  return (
    <figure className="border border-gray-100 p-8 dark:border-gray-600">
      <Space direction="vertical" size={5}>
        <blockquote className="mb-4 border-none" style={{ margin: 0, padding: 0 }}>
          {children}
        </blockquote>
        <Space size={4} className="align-center">
          <img
            src={'/images/blog/avatars/' + img}
            className="h-16 w-16 rounded-full object-cover text-center"
            style={{ margin: 0 }}
          />
          <figcaption style={{ marginTop: 0 }}>
            <p>{caption}</p>
          </figcaption>
        </Space>
      </Space>
    </figure>
  )
}
