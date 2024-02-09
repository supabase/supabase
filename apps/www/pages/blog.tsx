import fs from 'fs'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'

import PostTypes from '~/types/post'
import DefaultLayout from '~/components/Layouts/Default'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogFilters from '~/components/Blog/BlogFilters'
import FeaturedThumb from '~/components/Blog/FeaturedThumb'

function Blog(props: any) {
  const [blogs, setBlogs] = useState(props.blogs)
  const router = useRouter()

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
        <div className="overflow-hidden py-12 lg:py-20">
          <div className="container mx-auto px-8 sm:px-16 xl:px-20">
            <div className="mx-auto ">
              {props.blogs.slice(0, 1).map((blog: any, i: number) => (
                <FeaturedThumb key={i} {...blog} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-default border-t">
          <div className="container mx-auto mt-10 lg:mt-16 px-8 sm:px-16 xl:px-20">
            <BlogFilters
              allPosts={props.blogs}
              posts={blogs}
              setPosts={setBlogs}
              // setCategory={setCategory}
              // allCategories={allCategories}
              // handlePosts={handlePosts}
            />

            <ol className="grid grid-cols-12 py-10 lg:py-16 lg:gap-16">
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
                <p className="text-sm text-light col-span-full">No results</p>
              )}
            </ol>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

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

export default Blog
