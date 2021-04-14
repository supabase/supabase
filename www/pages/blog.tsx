import fs from 'fs'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Head from 'next/head'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import authors from 'lib/authors.json'

import DefaultLayout from '~/components/Layouts/Default'
import { Typography, Badge, Space, Select } from '@supabase/ui'
import PostTypes from '~/types/post'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogHeader from '~/components/Blog/BlogHeader'

export async function getStaticProps() {
  const allPostsData = getSortedPosts()
  const categories = getAllCategories()
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/rss.xml', rss)

  return {
    props: {
      blogs: allPostsData,
      categories,
    },
  }
}

function Blog(props: any) {
  const [category, setCategory] = useState('all')
  const [blogs, setBlogs] = useState(props.blogs)

  const { basePath } = useRouter()

  useEffect(() => {
    // Update the document title using the browser API
    setBlogs(
      category === 'all'
        ? props.blogs
        : props.blogs.filter((post: any) => {
            const found = post.tags.includes(category)
            return found
          })
    )
  }, [category])

  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS feed for blog posts"
          href={`${basePath}/rss.xml`}
        />
      </Head>
      <NextSeo title="Blog" description="Latest news from the Supabase team." />
      <DefaultLayout>
        <BlogHeader title="Blog" />
        <div className="bg-gray-50 dark:bg-dark-800 overflow-hidden py-12">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
            <div className="mx-auto max-w-7xl">
              <Typography.Title level={2}>Latests posts</Typography.Title>
              <div className="mt-5 max-w-lg mx-auto grid gap-16 lg:grid-cols-2 lg:max-w-none">
                {props.blogs.slice(0, 2).map((blog: any, idx: any) => {
                  return FeaturedThumb(blog)
                })}
              </div>
            </div>
          </div>
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-32">
            <div className="mx-auto max-w-7xl">
              <div className="grid grid-cols-12">
                <div className="col-span-12 lg:col-span-8">
                  <Typography.Title level={2}>More posts from the team</Typography.Title>
                </div>
                <div className="col-span-12 lg:col-span-4 mt-4 lg:mt-0">
                  <Space className="lg:justify-end" size={6}>
                    <Typography.Text>Select a category</Typography.Text>
                    <Select
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setCategory(e.target.value)
                      }
                    >
                      <Select.Option key={'all'} value={'all'}>
                        Show all
                      </Select.Option>
                      {props.categories.map((categoryId: string) => (
                        <Select.Option key={categoryId} value={categoryId}>
                          {categoryId}
                        </Select.Option>
                      ))}
                    </Select>
                  </Space>
                </div>
              </div>
              <div className="mt-12 max-w-lg mx-auto grid lg:grid-cols-1 lg:max-w-none">
                {/* <ul> */}
                {blogs.map((blog: PostTypes, idx: number) => (
                  <BlogListItem blog={blog} key={idx} />
                ))}
                {/* </ul> */}
              </div>{' '}
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

function FeaturedThumb(blog: PostTypes) {
  // @ts-ignore
  const author = blog.author ? authors[blog.author] : authors['supabase']

  return (
    <div key={blog.slug} className="my-6 cursor-pointer">
      <a href={`/blog/${blog.url}`}>
        <a className="inline-block">
          <img
            className="h-96 w-full object-cover  border dark:border-dark-600"
            src={`/new/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
          />
          <Space direction="vertical" size={5} className="mt-4">
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
                      <a href={`/blog/tags/${tag}`}>
                        <a>
                          <Badge key={`${blog.slug}-${tag}-tag`} dot={false}>
                            {tag}
                          </Badge>
                        </a>
                      </a>
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
          </Space>
        </a>
      </a>
    </div>
  )
}

export default Blog
