'use client'

import { useState } from 'react'
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
  const [blogs, setBlogs] = useState(props.blogs)
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const isList = view === 'list'

  return (
    <>
      <DefaultLayout>
        <h1 className="sr-only">Supabase blog</h1>
        <div className="container relative mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
          {props.blogs.slice(0, 1).map((blog) => (
            <FeaturedThumb key={blog.slug} {...blog} />
          ))}
        </div>

        <div className="border-default border-t">
          <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
            <BlogFilters allPosts={props.blogs} setPosts={setBlogs} view={view} setView={setView} />

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
