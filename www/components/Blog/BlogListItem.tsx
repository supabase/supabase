import authors from 'lib/authors.json'
import React from 'react'
import Image from 'next/image'
import PostTypes from '~/types/post'

interface Props {
  post: PostTypes
}

const BlogListItem = ({ post }: Props) => {
  // @ts-ignore
  const authorArray = blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      // @ts-ignore
      authors.find((authors: string) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
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
            {author.map((author: any) => {
              return (
                <div className="flex items-center">
                  {author.author_image_url && (
                    <img src={author.author_image_url} className="rounded-full w-10 mr-4" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm m-0 text-scale-1200">{author.author}</span>
                    <span className="text-xs m-0 text-scale-900">{author.position}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </a>
    </div>
  )
}

export default BlogListItem
