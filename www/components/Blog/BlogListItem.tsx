import { Space } from '@supabase/ui'
import authors from 'lib/authors.json'
import React from 'react'
import Image from 'next/image'
import PostTypes from '~/types/post'

interface Props {
  blog: PostTypes
}

const BlogListItem = ({ blog }: Props) => {
  // @ts-ignore
  const author = blog.author ? authors[blog.author] : authors['supabase']

  return (
    <div key={blog.slug}>
      <a href={`/blog/${blog.url}`}>
        <div className="inline-block min-w-full group">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-3">
              <div
                className={`relative overflow-auto w-full h-60 border border-scale-600 shadow-sm rounded-lg mb-4`}
              >
                <Image
                  layout="fill"
                  src={
                    !blog.thumb ? `/images/blog/blog-placeholder.png` : `/images/blog/${blog.thumb}`
                  }
                  objectFit="cover"
                  className="transform duration-100 ease-in scale-100 group-hover:scale-105"
                />
              </div>

              <div>
                <h3 className="m-0">{blog.title}</h3>
              </div>
              <p className="text-xs">{blog.date}</p>

              <p className="m-0">
                <p className="text-base mb-0">{blog.description}</p>
              </p>
            </div>
            {author && (
              <div className="flex items-center">
                {author.author_image_url && (
                  <img src={author.author_image_url} className="rounded-full w-10 mr-4" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm m-0 text-scale-1200">{author.author}</span>
                  <span className="text-xs m-0 text-scale-900">{author.position}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </a>
    </div>
  )
}

export default BlogListItem
