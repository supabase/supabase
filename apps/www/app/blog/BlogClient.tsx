'use client'

import { useState, useEffect } from 'react'
import DefaultLayout from 'components/Layouts/Default'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import BlogFilters from 'components/Blog/BlogFilters'
import FeaturedThumb from 'components/Blog/FeaturedThumb'
import { cn } from 'ui'
import { LOCAL_STORAGE_KEYS, isBrowser } from 'common'

import type PostTypes from 'types/post'
import { Loader2 } from 'lucide-react'

export type BlogView = 'list' | 'grid'

export default function BlogClient(props: { blogs: any[] }) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [isLoading, setIsLoading] = useState(true)
  const [cmsPosts, setCmsPosts] = useState<any[]>([])
  const [blogs, setBlogs] = useState(props.blogs)
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const isList = view === 'list'

  // Combine static and CMS posts and sort by date
  const allPosts = [...props.blogs, ...cmsPosts]?.sort((a: any, b: any) => {
    const dateA = a.date ? new Date(a.date).getTime() : new Date(a.formattedDate).getTime()
    const dateB = b.date ? new Date(b.date).getTime() : new Date(b.formattedDate).getTime()
    return dateB - dateA
  })

  useEffect(() => {
    setBlogs((prev: any[]) => (prev.length === props.blogs.length ? allPosts : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsPosts])

  useEffect(() => {
    const fetchCmsPosts = async () => {
      try {
        // Use new unified API with preview mode for blog listing
        const res = await fetch('/api-v2/cms-posts?mode=preview&limit=100')
        const data = await res.json()
        if (data.success && Array.isArray(data.posts)) {
          setCmsPosts(data.posts)
        }
      } catch (e) {
        console.error('Failed to load CMS posts', e)
      }
    }
    fetchCmsPosts()
    setIsLoading(false)
  }, [])

  return (
    <>
      <DefaultLayout>
        <h1 className="sr-only">Supabase blog</h1>
        <div className="container relative mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
          {isLoading && (
            <div className="w-4 h-4 absolute z-20 top-4 right-4 sm:right-16 xl:right-20 flex items-end justify-center">
              <Loader2 className="w-4 h-4 transform animate-spinner text-foreground-muted" />
            </div>
          )}
          {allPosts.slice(0, 1).map((blog: any) => (
            <FeaturedThumb key={blog.slug} {...blog} />
          ))}
        </div>

        <div className="border-default border-t">
          <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
            <BlogFilters allPosts={allPosts} setPosts={setBlogs} view={view} setView={setView} />

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
