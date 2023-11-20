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
            <div
              className={`border-default relative mb-4 w-full aspect-[2/1] lg:aspect-[3/2] overflow-auto rounded-lg border shadow-sm`}
            >
              <Image
                layout="fill"
                src={
                  !post.thumb
                    ? `/images/blog/blog-placeholder.png`
                    : post.type === 'casestudy'
                    ? post.thumb
                    : `/images/blog/${post.thumb}`
                }
                objectFit="cover"
                className="scale-100 object-cover overflow-hidden transform duration-100 ease-in group-hover:scale-105"
                alt="case study thumbnail"
              />
            </div>

            <h3 className="text-foreground max-w-sm text-xl">{post.title}</h3>
            <p className="text-foreground-light max-w-sm text-base">{post.description}</p>
            {post.date && (
              <div className="text-foreground-light flex items-center space-x-1.5 text-sm">
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
                <div className="relative ring-background w-10 h-10 rounded-full ring-2" key={i}>
                  {author.author_image_url && (
                    <Image
                      src={author.author_image_url}
                      className="rounded-full border border-default w-full h-full"
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
