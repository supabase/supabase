import fs from 'fs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'
// CMS posts are fetched client-side from /api-v2/cms-posts to keep server bundle small

import type PostTypes from '~/types/post'
import DefaultLayout from '~/components/Layouts/Default'
import BlogGridItem from '~/components/Blog/BlogGridItem'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogFilters from '~/components/Blog/BlogFilters'
import FeaturedThumb from '~/components/Blog/FeaturedThumb'
import { cn } from 'ui'
import { LOCAL_STORAGE_KEYS, isBrowser } from 'common'

export type BlogView = 'list' | 'grid'

function Blog(props: any) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [cmsPosts, setCmsPosts] = useState<any[]>([])
  const [blogs, setBlogs] = useState(props.blogs)
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const isList = view === 'list'
  const router = useRouter()

  const meta_title = 'Supabase Blog: the Postgres development platform'
  const meta_description = 'Get all your Supabase News on the Supabase blog.'

  // Merge CMS posts with static ones when CMS posts arrive
  const allPosts = [...props.blogs, ...cmsPosts].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Keep list in sync once after CMS posts load, but don't override user filters later
  useEffect(() => {
    setBlogs((prev: any[]) => (prev.length === props.blogs.length ? allPosts : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsPosts])

  // Fetch CMS posts
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchCmsPosts = async () => {
      try {
        const res = await fetch('/api-v2/cms-posts')
        const data = await res.json()
        if (data.success && Array.isArray(data.posts)) {
          setCmsPosts(data.posts)
        }
      } catch (e) {
        console.error('Failed to load CMS posts', e)
      }
    }
    fetchCmsPosts()
  }, [])

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
              url: `https://supabase.com/images/og/supabase-og.png`,
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
        <div className="md:container mx-auto py-4 lg:py-10 px-4 sm:px-12 xl:px-16">
          {allPosts.slice(0, 1).map((blog: any) => (
            <FeaturedThumb key={blog.slug} {...blog} />
          ))}
        </div>

        <div className="border-default border-t">
          <div className="md:container mx-auto mt-6 lg:mt-8 px-6 sm:px-16 xl:px-20">
            <BlogFilters
              allPosts={allPosts}
              setPosts={setBlogs}
              view={view as BlogView}
              setView={setView}
            />

            <ol
              className={cn(
                'grid -mx-2 sm:-mx-4 py-6 lg:py-6 lg:pb-20',
                isList ? 'grid-cols-1' : 'grid-cols-12 lg:gap-4'
              )}
            >
              {blogs?.length ? (
                blogs?.map((blog: PostTypes, idx: number) =>
                  isList ? (
                    <div
                      className="col-span-12 px-2 sm:px-4 [&_a]:last:border-none"
                      key={`list-${idx}-${blog.slug}`}
                    >
                      <BlogListItem post={blog} />
                    </div>
                  ) : (
                    <div
                      className="col-span-12 mb-4 md:col-span-12 lg:col-span-6 xl:col-span-4 h-full"
                      key={`grid-${idx}-${blog.slug}`}
                    >
                      <BlogGridItem post={blog} />
                    </div>
                  )
                )
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
  // Get static blog posts
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  // Only static data at build time; CMS posts are fetched client-side
  const allPostsData = [...staticPostsData].sort((a: any, b: any) => {
    const dateA = a.date ? new Date(a.date).getTime() : new Date(a.formattedDate).getTime()
    const dateB = b.date ? new Date(b.date).getTime() : new Date(b.formattedDate).getTime()
    return dateB - dateA
  })

  // Generate RSS feed from combined posts
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
    // revalidate: 60 * 10, // Revalidate every 10 minutes
  }
}

export default Blog
