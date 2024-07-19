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

const BlogGridItem = ({ post }: Props) => {
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
      className="group inline-block min-w-full p-2 sm:p-4 h-full border border-transparent hover:border-overlay transition-all hover:bg-overlay rounded-xl"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1">
          <div className="border-default relative mb-3 w-full aspect-[2/1] lg:aspect-[5/3] overflow-hidden rounded-lg border shadow-sm">
            <Image
              fill
              sizes="100%"
              quality={100}
              src={
                !post.thumb
                  ? `/images/blog/blog-placeholder.png`
                  : post.type === 'casestudy'
                    ? post.thumb
                    : `/images/blog/${post.thumb}`
              }
              className="scale-100 object-cover overflow-hidden"
              alt={`${post.title} thumbnail`}
            />
          </div>

          {post.date && (
            <div className="text-foreground-lighter flex items-center space-x-1.5 text-sm">
              <p>{dayjs(post.date).format('D MMM YYYY')}</p>
              {post.readingTime && (
                <>
                  <p>•</p>
                  <p>{post.readingTime}</p>
                </>
              )}
            </div>
          )}
          <h3 className="text-foreground max-w-sm text-xl">{post.title}</h3>
          <p className="text-foreground-light max-w-sm text-base !mb-0">{post.description}</p>
        </div>
      </div>
    </Link>
  )
}

export default BlogGridItem
