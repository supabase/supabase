'use client'

import { Suspense, useEffect, useState } from 'react'
import DefaultLayout from 'components/Layouts/Default'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import BlogFilters from 'components/Blog/BlogFilters'
import FeaturedThumb from 'components/Blog/FeaturedThumb'
import { cn } from 'ui'
import { LOCAL_STORAGE_KEYS, isBrowser } from 'common'

import type PostTypes from 'types/post'

export type BlogView = 'list' | 'grid'

export default function BlogClient(props: { blogs: any[] }) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [cmsPosts, setCmsPosts] = useState<any[]>([])
  const [blogs, setBlogs] = useState(props.blogs)
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const isList = view === 'list'

  const allPosts = [...props.blogs, ...cmsPosts].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  useEffect(() => {
    setBlogs((prev: any[]) => (prev.length === props.blogs.length ? allPosts : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsPosts])

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
      <DefaultLayout>
        <h1 className="sr-only">Supabase blog</h1>
        <div className="md:container mx-auto py-4 lg:py-10 px-4 sm:px-12 xl:px-16">
          {allPosts.slice(0, 1).map((blog: any) => (
            <FeaturedThumb key={blog.slug} {...blog} />
          ))}
        </div>

        <div className="border-default border-t">
          <div className="md:container mx-auto mt-6 lg:mt-8 px-6 sm:px-16 xl:px-20">
            <Suspense>
              <BlogFilters allPosts={allPosts} setPosts={setBlogs} view={view} setView={setView} />
            </Suspense>

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
