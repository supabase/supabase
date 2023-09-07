import fs from 'fs'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'
import authors from 'lib/authors.json'

import PostTypes from '~/types/post'
import DefaultLayout from '~/components/Layouts/Default'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogFilters from '~/components/Blog/BlogFilters'

export async function getStaticProps() {
  const allPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/rss.xml', rss)

  // generate a series of rss feeds for each author (for PlanetPG)
  const planetPgPosts = allPostsData.filter((post: any) => post.tags?.includes('planetpg'))
  const planetPgAuthors = planetPgPosts.map((post: any) => post.author.split(','))
  const uniquePlanetPgAuthors = new Set([].concat(...planetPgAuthors))

  uniquePlanetPgAuthors.forEach((author) => {
    const authorPosts = planetPgPosts.filter((post: any) => post.author.includes(author))
    if (authorPosts.length > 0) {
      const authorRss = generateRss(authorPosts, author)
      fs.writeFileSync(`./public/planetpg-${author}-rss.xml`, authorRss)
    }
  })

  return {
    props: {
      blogs: allPostsData,
    },
  }
}

function Blog(props: any) {
  const [blogs, setBlogs] = useState(props.blogs)
  const [category, setCategory] = useState<string>('all')

  // Using hard-coded categories as they:
  // - serve as a reference
  // - are easier to reorder
  const allCategories = [
    'all',
    'product',
    'company',
    'postgres',
    'developers',
    'engineering',
    'launch-week',
  ]
  const router = useRouter()

  const meta_title = 'Supabase Blog: Open Source Firebase alternative Blog'
  const meta_description = 'Get all your Supabase News on the Supabase blog.'

  useEffect(() => {
    handlePosts()
  }, [category])

  const handlePosts = () => {
    // construct an array of blog posts
    // not inluding the first blog post
    const shiftedBlogs = [...props.blogs]
    shiftedBlogs.shift()

    if (category === 'all') {
      router.replace('/blog', undefined, { shallow: true, scroll: false })
    } else {
      router.query.category = category
      router.replace(router, undefined, { shallow: true, scroll: false })
    }

    setBlogs(
      category === 'all'
        ? shiftedBlogs
        : props.blogs.filter((post: any) => {
            const found = post.categories?.includes(category)
            return found
          })
    )
  }

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
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
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
        <h1 className="sr-only">Supabase blog</h1>
        <div className="overflow-hidden py-12">
          <div className="container mx-auto mt-16 px-8 sm:px-16 xl:px-20">
            <div className="mx-auto ">
              {props.blogs.slice(0, 1).map((blog: any, i: number) => (
                <FeaturedThumb key={i} {...blog} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-scale-600 border-t">
          <div className="container mx-auto mt-16 px-8 sm:px-16 xl:px-20">
            <BlogFilters
              posts={blogs}
              setPosts={setBlogs}
              setCategory={setCategory}
              allCategories={allCategories}
              handlePosts={handlePosts}
            />

            <ol className="grid grid-cols-12 py-16 lg:gap-16">
              {blogs?.length ? (
                blogs?.map((blog: PostTypes, idx: number) => (
                  <div
                    className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                    key={idx}
                  >
                    <BlogListItem post={blog} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-scale-800 col-span-full">No results</p>
              )}
            </ol>
          </div>
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
    <div key={blog.slug} className="w-full cursor-pointer">
      <Link href={`${blog.path}`}>
        <a className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="relative h-96 w-full overflow-auto rounded-lg border">
            <Image
              src={`/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
              layout="fill"
              objectFit="cover"
              alt="blog thumbnail"
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

            <div className="grid w-max grid-flow-col grid-rows-4 gap-4">
              {author.map((author: any, i: number) => {
                return (
                  <div className="flex items-center space-x-3" key={i}>
                    {author.author_image_url && (
                      <div className="relative h-10 w-10 overflow-auto">
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
                      <span className="text-scale-1200 m-0 text-sm">{author.author}</span>
                      <span className="text-scale-900 m-0 text-xs">{author.position}</span>
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
