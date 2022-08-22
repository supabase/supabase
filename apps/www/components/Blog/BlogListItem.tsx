import authors from 'lib/authors.json'
import Image from 'next/image'
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
      <a href={`${post.path}`}>
        <div className="group inline-block min-w-full">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-3">
              <div
                className={`border-scale-300 relative mb-4 h-60 w-full overflow-auto rounded-lg border shadow-sm`}
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
                  className="scale-100 transform duration-100 ease-in group-hover:scale-105"
                  alt="case study thumbnail"
                />
              </div>

              <h3 className="text-scale-1200 max-w-sm text-xl">{post.title}</h3>
              {post.date && <p className="text-scale-1100 text-xs">{post.date}</p>}
              <p className="text-scale-1100 max-w-sm text-base">{post.description}</p>
            </div>
            <div className="flex items-center -space-x-2">
              {author.map((author: any) => {
                return (
                  <div className="dark:ring-scale-200 w-10 rounded-full ring-2 ring-white">
                    {author.author_image_url && (
                      <Image
                        src={author.author_image_url}
                        className="dark:border-dark rounded-full border"
                        width="100%"
                        height="100%"
                        layout="responsive"
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
