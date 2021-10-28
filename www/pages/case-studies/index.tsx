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
import ImageGrid from '~/components/ImageGrid'

export async function getStaticProps() {
  const allPostsData = getSortedPosts('_casestudies')
  const categories = getAllCategories('_casestudies')
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/case-studies-rss.xml', rss)

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

  const caseStudyThumbs = blogs.map((blog: PostTypes, idx: number) => {
    return {
      image: '/image/asds',
      name: 'dsad ',
    }
  })

  console.log(caseStudyThumbs)

  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS feed for case studies"
          href={`${basePath}/case-studies-rss.xml`}
        />
      </Head>
      <NextSeo title="Case studies" description="Latest customers using Supabase" />
      <DefaultLayout>
        <BlogHeader title="Case studies" />
        <div className="bg-gray-50 dark:bg-dark-800 overflow-hidden py-12">
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
                <ImageGrid images={caseStudyThumbs} />
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default Blog
