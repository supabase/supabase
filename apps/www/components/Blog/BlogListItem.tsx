import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Badge } from 'ui'

import blogAuthors from '@/lib/authors.json'
import type PostTypes from '@/types/post'

interface Props {
  post: PostTypes
}

const getAuthors = (post: PostTypes) => {
  const authorArray = post.author?.split(',').map((a) => a.trim()) || []
  const authors = []

  for (let i = 0; i < authorArray.length; i++) {
    const foundAuthor = blogAuthors.find((authors: any) => {
      return authors.author_id === authorArray[i]
    })
    if (foundAuthor) {
      authors.push(foundAuthor)
    }
  }
  return authors
}

const BlogListItem = ({ post }: Props) => {
  const authors = getAuthors(post)

  const sanitizeCategory = (category: string) => category.replaceAll('-', ' ')

  return (
    <Link
      href={post.path}
      prefetch={false}
      className="group flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b"
    >
      <div className="flex w-full lg:col-span-8 xl:col-span-8">
        <h3 className="text-foreground text-lg group-hover:underline">{post.title}</h3>
      </div>
      <div className="lg:col-span-2 xl:col-span-4 flex justify-start items-center lg:grid grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
        <div className="hidden lg:flex items-center -space-x-2">
          {authors.map((author: any, i: number) => {
            if (!author) return null
            return (
              <div className="relative ring-background w-6 h-6 rounded-full ring-2" key={i}>
                {author.author_image_url && (
                  <Image
                    src={author.author_image_url}
                    className="rounded-full object-cover border border-default w-full h-full"
                    alt={`${author.author} avatar`}
                    fill
                  />
                )}
              </div>
            )
          })}
        </div>
        {post.categories && (
          <div className="hidden xl:flex text-foreground-lighter group-hover:text-foreground-light">
            {post.categories.map(
              (category, i) =>
                i === 0 && (
                  <Badge key={category} className="group-hover:border-foreground-muted">
                    {sanitizeCategory(category)}
                  </Badge>
                )
            )}
          </div>
        )}
        {post.date && (
          <p className="text-foreground-lighter group-hover:text-foreground-light flex-1 lg:text-right w-full">
            {dayjs(post.date).format('D MMM YYYY')}
          </p>
        )}
      </div>
    </Link>
  )
}

export default BlogListItem
