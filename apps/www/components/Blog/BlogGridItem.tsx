import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Author from '~/types/author'
import PostTypes from '~/types/post'
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
        {/* <div className="flex items-center -space-x-2">
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
        </div> */}
      </div>
    </Link>
  )
}

export default BlogGridItem
