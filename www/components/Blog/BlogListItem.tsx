import React from 'react'
import Link from 'next/link'
import { Typography, Badge, Space } from '@supabase/ui'
import PostTypes from '~/types/post'
import authors from 'lib/authors.json'

interface Props {
  blog: PostTypes
}

const BlogListItem = ({ blog }: Props) => {
  // @ts-ignore
  const author = blog.author ? authors[blog.author] : authors['supabase']
  return (
    <div key={blog.slug} className="pt-4 pb-12 border-b border-gray-100 dark:border-gray-600 mb-8">
      <div className="mx-auto max-w-7xl cursor-pointer">
        <Link href={`/blog/${blog.url}`} as={`/blog/${blog.url}`}>
          <a className="inline-block">
            <Space direction="vertical" size={5} className="">
              <div>
                <Space className="mb-2">
                  <Typography.Text type="secondary">{blog.date}</Typography.Text>
                  <Typography.Text type="secondary">•</Typography.Text>
                  <Typography.Text type="secondary">{blog.readingTime}</Typography.Text>
                </Space>

                <Space direction="vertical" size={3}>
                  <Typography.Title level={3} className="">
                    {blog.title}
                  </Typography.Title>

                  <Space className="block">
                    {blog.tags &&
                      blog.tags.map((tag: string) => (
                        <Link href={`/blog/tags/${tag}`} as={`/blog/tags/${tag}`}>
                          <a>
                            <Badge key={`${blog.slug}-${tag}-tag`} dot={false}>
                              {tag}
                            </Badge>
                          </a>
                        </Link>
                      ))}
                  </Space>
                </Space>
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
              {/* <Typography>
                <ReactMarkdown>{blog.content.substring(0, 210) + '...'}</ReactMarkdown>
              </Typography>
              <Typography.Link>Read more</Typography.Link> */}
            </Space>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default BlogListItem
