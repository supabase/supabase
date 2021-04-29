import React from 'react'
import { Typography } from '@supabase/ui'

interface Props {
  title: string
}

export default function BlogHeader({ title }: Props) {
  return (
    <div className="bg-white dark:bg-dark-800 overflow-hidden py-12 border-b dark:border-gray-600">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
        <div className="mx-auto max-w-7xl">
          <Typography.Title>{title}</Typography.Title>
        </div>
      </div>
    </div>
  )
}
