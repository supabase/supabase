import fs from 'fs'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Head from 'next/head'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import authors from 'lib/authors.json'

import DefaultLayout from '~/components/Layouts/Default'
import {
  Typography,
  Badge,
  Space,
  Dropdown,
  Button,
  IconChevronDown,
  Tabs,
  Input,
  IconMail,
} from '@supabase/ui'
import PostTypes from '~/types/post'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogHeader from '~/components/Blog/BlogHeader'
import { Panel } from '@supabase/ui/dist/cjs/components/Tabs/Tabs'

export async function getStaticProps() {
  const allPostsData = getSortedPosts('_blog')
  const categories = getAllCategories('_blog')
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

  useEffect(() => {
    return props.categories.unshift('all')
  }, [])

  // append 'all' category
  // const categories = props.categories.push('all')

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
        {/* <BlogHeader title="Blog" className="pb-0" /> */}
        <div className="bg-white dark:bg-dark-800 overflow-hidden py-12">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
            <div className="mx-auto ">
              {props.blogs.slice(0, 1).map((blog: any, idx: any) => {
                return FeaturedThumb(blog)
              })}
            </div>
          </div>
        </div>

        <div className="border-t dark:border-dark">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
            <div className="mx-auto ">
              <div className="grid grid-cols-12">
                <div className="col-span-12 lg:col-span-12">
                  <Tabs scrollable size="medium" onChange={setCategory} defaultActiveId={'all'}>
                    {props.categories.map((categoryId: string) => (
                      <Tabs.Panel id={categoryId} label={categoryId}>
                        {/* <p>{categoryId}</p> */}
                        <></>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </div>
              </div>
            </div>

            <div className="">
              <div className="">
                <ol className="grid grid-cols-12 mt-16 gap-16">
                  {blogs.map((blog: PostTypes, idx: number) => (
                    <div className="col-span-4 mb-16">
                      <BlogListItem blog={blog} key={idx} />
                    </div>
                  ))}
                </ol>
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
    <div key={blog.slug} className="cursor-pointer w-full">
      <a href={`/blog/${blog.url}`}>
        <a className="grid grid-cols-2 gap-16">
          <img
            className="h-96 w-full object-cover border dark:border-dark rounded-lg"
            src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
          />
          <Space direction="vertical" size={5} className="">
            <div>
              <Space className="mb-2">
                <Typography.Text type="secondary">{blog.date}</Typography.Text>
                <Typography.Text type="secondary">•</Typography.Text>
                <Typography.Text type="secondary">{blog.readingTime}</Typography.Text>
              </Space>

              <Space direction="vertical" size={3}>
                <Typography.Title level={2} className="m-0">
                  {blog.title}
                </Typography.Title>
                <Typography.Text className="m-0" type="secondary">
                  <span className="text-xl">{blog.description}</span>
                </Typography.Text>

                <Space className="block">
                  {blog.tags &&
                    blog.tags.map((tag: string) => (
                      <a href={`/blog/tags/${tag}`}>
                        <a>
                          <Badge color="gray" key={`${blog.slug}-${tag}-tag`} dot={false}>
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
