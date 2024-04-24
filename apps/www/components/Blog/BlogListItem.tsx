import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import type Author from '~/types/author'
import type PostTypes from '~/types/post'
import dayjs from 'dayjs'

interface Props {
  post: PostTypes
}

const BlogListItem = ({ post }: Props) => {
  const authorArray: string[] | undefined = post.author ? post.author.split(',') : []
  const author = []

  if (authorArray) {
    for (let i = 0; i < authorArray.length; i++) {
      author.push(
        authors.find((authors: Author) => {
          return authors.author_id === authorArray[i]
        })
      )
    }
  }

  return (
    <Link
      href={post.path}
      className="group flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b"
    >
      <div className="flex w-full lg:col-span-8 xl:col-span-8">
        <h3 className="text-foreground text-lg group-hover:underline">{post.title}</h3>
      </div>
      <div className="lg:col-span-2 xl:col-span-4 flex justify-start items-center lg:grid grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
        <div className="hidden lg:flex items-center -space-x-2">
          {author.map((author: any, i: number) => {
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
          <div className="hidden xl:flex text-foreground-lighter">
            {post.categories.map(
              (category, i) =>
                i === 0 && (
                  <p className="border border-muted py-1 px-2 rounded text-center w-auto capitalize">
                    {category}
                  </p>
                )
            )}
          </div>
        )}
        {post.date && (
          <p className="text-foreground-lighter flex-1 lg:text-right w-full">
            {dayjs(post.date).format('D MMM YYYY')}
          </p>
        )}
      </div>
    </Link>
  )
}

export default BlogListItem
