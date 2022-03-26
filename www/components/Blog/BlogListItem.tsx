import authors from 'lib/authors.json'
import React from 'react'
import Image from 'next/image'
import PostTypes from '~/types/post'

interface Props {
  post: PostTypes
}

const BlogListItem = ({ post }: Props) => {
  // @ts-ignore
  const authorArray = post.author && post.author.split(',')

  const author = []
  if (post.author) {
    for (let i = 0; i < authorArray.length; i++) {
      author.push(
        // @ts-ignore
        authors.find((authors: string) => {
          // @ts-ignore
          return authors.author_id === authorArray[i]
        })
      )
    }
  }

  return (
    <div key={post.slug}>
      <a href={`/blog/${post.url}`}>
        <div className="inline-block min-w-full group">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-3">
              <div
                className={`relative overflow-auto w-full h-60 border border-scale-300 shadow-sm rounded-lg mb-4`}
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
                  className="transform duration-100 ease-in scale-100 group-hover:scale-105"
                />
              </div>

              <h3 className="text-xl text-scale-1200 max-w-sm">{post.title}</h3>
              {post.date && <p className="text-xs text-scale-1100">{post.date}</p>}
              <p className="text-base text-scale-1100 max-w-sm">{post.description}</p>
            </div>
            <div className="flex items-center -space-x-2">
              {author.map((author: any) => {
                return (
                  <div>
                    {author.author_image_url && (
                      <img
                        src={author.author_image_url}
                        className="rounded-full w-10 ring-2 ring-white dark:ring-scale-200"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}

export default BlogListItem
