import fs from 'fs'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import authors from 'lib/authors.json'

import DefaultLayout from '~/components/Layouts/Default'
import { Tabs } from '@supabase/ui'
import PostTypes from '~/types/post'
import BlogListItem from '~/components/Blog/BlogListItem'

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

  const router = useRouter()

  useEffect(() => {
    // contruct an array of blog posts
    // not inluding the first blog post
    const shiftedBlogs = [...props.blogs]
    shiftedBlogs.shift()

    setBlogs(
      category === 'all'
        ? shiftedBlogs
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
  const meta_title = 'Supabase Blog: Open Source Firebase alternative Blog'
  const meta_description = 'Get all your Supabase News on the Supabase blog.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image.jpg`,
            },
          ],
        }}
        additionalLinkTags={[
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: `https://supabase.com/rss.xml`,
          },
        ]}
      />
      <DefaultLayout>
        <div className="overflow-hidden py-12">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
            <div className="mx-auto ">
              {props.blogs.slice(0, 1).map((blog: any, i: number) => (
                <FeaturedThumb key={i} {...blog} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-scale-600">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
            <div className="mx-auto ">
              <div className="grid grid-cols-12">
                <div className="col-span-12 lg:col-span-12">
                  <Tabs scrollable size="medium" onChange={setCategory} defaultActiveId={'all'}>
                    {props.categories.map((categoryId: string) => (
                      <Tabs.Panel id={categoryId} key={categoryId} label={categoryId}>
                        {/* <p>{categoryId}</p> */}
                        <></>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </div>
              </div>
            </div>

            <ol className="grid grid-cols-12 py-16 lg:gap-16">
              {blogs.map((blog: PostTypes, idx: number) => (
                <div
                  className="col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-4 mb-16"
                  key={idx}
                >
                  <BlogListItem post={blog} />
                </div>
              ))}
            </ol>
          </div>{' '}
        </div>
      </DefaultLayout>
    </>
  )
}

function FeaturedThumb(blog: PostTypes) {
  // @ts-ignore
  const authorArray = blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    // @ts-ignore
    author.push(
      authors.find((authors: any) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  return (
    <div key={blog.slug} className="cursor-pointer w-full">
      <Link href={`/blog/${blog.url}`}>
        <a className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="relative overflow-auto w-full h-96 border rounded-lg">
            <Image
              src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-scale-900 flex space-x-2 text-sm">
              <p>{blog.date}</p>
              <p>•</p>
              <p>{blog.readingTime}</p>
            </div>

            <div>
              <h2 className="h2">{blog.title}</h2>
              <p className="p text-xl">{blog.description}</p>
            </div>

            <div className="grid grid-rows-4 grid-flow-col gap-4 w-max">
              {author.map((author: any) => {
                return (
                  <div className="flex space-x-3 items-center">
                    {author.author_image_url && (
                      <div className="relative overflow-auto w-10 h-10">
                        <Image
                          src={author.author_image_url}
                          alt={`${author.author} avatar`}
                          className="rounded-full"
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="m-0 text-sm text-scale-1200">{author.author}</span>
                      <span className="m-0 text-xs text-scale-900">{author.position}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default Blog
