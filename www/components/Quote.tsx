import { Space, Typography } from '@supabase/ui'
import React from 'react'

interface Props {
  children: React.ReactNode
  caption: string
  img: string
}

export default function Quote(props: Props) {
  const { children, caption, img } = props

  return (
    <figure className="border border-gray-100 dark:border-gray-600 p-8">
      <Space direction="vertical" size={5}>
        <blockquote className="border-none mb-4" style={{ margin: 0, padding: 0 }}>
          {children}
        </blockquote>
        <Space size={4} className="align-center">
          <img
            src={'/new/images/blog/avatars/' + img}
            className="rounded-full w-16 h-16 object-cover text-center"
            style={{ margin: 0 }}
          />
          <figcaption style={{ marginTop: 0 }}>
            <Typography.Text>{caption}</Typography.Text>
          </figcaption>
        </Space>
      </Space>
    </figure>
  )
}
