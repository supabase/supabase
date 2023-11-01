import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Author from '~/types/author'
import PostTypes from '~/types/post'

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
    <div>
      <Link href={post.path} className="group inline-block min-w-full">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-3">
            <div className="border-scale-300 relative mb-4 h-60 w-full overflow-hidden rounded-lg border shadow-sm">
              <Image
                fill
                src={
                  !post.thumb
                    ? `/images/blog/blog-placeholder.png`
                    : post.type === 'casestudy'
                    ? post.thumb
                    : `/images/blog/${post.thumb}`
                }
                className="object-cover scale-100 transform duration-100 ease-in group-hover:scale-105"
                alt={post.title}
              />
            </div>

            <h3 className="text-foreground max-w-sm text-xl">{post.title}</h3>
            <p className="text-light max-w-sm text-base">{post.description}</p>
            {post.date && (
              <div className="text-muted flex items-center space-x-1.5 text-sm">
                <p>{post.date}</p>
                {post.readingTime && (
                  <>
                    <p>•</p>
                    <p>{post.readingTime}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center -space-x-2">
            {author.map((author: any, i: number) => {
              return (
                <div
                  className="relative dark:ring-scale-200 w-10 h-10 rounded-full ring-2 ring-white"
                  key={i}
                >
                  {author.author_image_url && (
                    <Image
                      src={author.author_image_url}
                      className="dark:border-dark rounded-full border w-full h-full"
                      alt={`${author.author} avatar`}
                      layout="fill"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default BlogListItem
