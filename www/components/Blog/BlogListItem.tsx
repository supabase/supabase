import { Space, Typography } from '@supabase/ui'
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
              <div className="relative overflow-auto w-full h-60 border dark:border-dark shadow-sm rounded-lg mb-4">
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
                <Typography.Title level={3} className="m-0">
                  {blog.title}
                </Typography.Title>
              </div>
              <Typography.Text type="secondary" small>
                {blog.date}
              </Typography.Text>

              <Typography.Text className="m-0" type="secondary">
                <p className="text-base mb-0">{blog.description}</p>
              </Typography.Text>
            </div>
            {author && (
              <div>
                <Space size={4}>
                  {author.author_image_url && (
                    <img src={author.author_image_url} className="rounded-full w-10" />
                  )}
                  <Space direction="vertical" size={0}>
                    <Typography.Text>{author.author}</Typography.Text>
                    <Typography.Text type="secondary" small>
                      {author.position}
                    </Typography.Text>
                  </Space>
                </Space>
              </div>
            )}
          </div>
        </div>
      </a>
    </div>
  )
}

export default BlogListItem
