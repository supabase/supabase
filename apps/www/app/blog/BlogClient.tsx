'use client'

import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import BlogFilters from 'components/Blog/BlogFilters'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { useInfiniteScrollWithFetch } from 'hooks/useInfiniteScroll'
import { Suspense, useCallback, useState } from 'react'
import type PostTypes from 'types/post'
import { cn } from 'ui'

export type BlogView = 'list' | 'grid'

const POSTS_PER_PAGE = 25
const SKELETON_COUNT = 6

function BlogListItemSkeleton() {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full border-b">
      <div className="flex w-full lg:col-span-8 xl:col-span-8">
        <div className="h-6 bg-foreground-muted/20 rounded-sm animate-pulse w-3/4" />
      </div>
      <div className="lg:col-span-2 xl:col-span-4 flex justify-start items-center lg:grid grid-cols-2 xl:grid-cols-3 gap-2 text-sm mt-2 lg:mt-0">
        <div className="hidden lg:flex items-center -space-x-2">
          <div className="w-6 h-6 rounded-full bg-foreground-muted/20 animate-pulse" />
          <div className="w-6 h-6 rounded-full bg-foreground-muted/20 animate-pulse" />
        </div>
        <div className="hidden xl:block">
          <div className="h-5 w-16 bg-foreground-muted/20 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 lg:text-right">
          <div className="h-4 w-24 bg-foreground-muted/20 rounded-sm animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  )
}

function BlogGridItemSkeleton() {
  return (
    <div className="inline-block min-w-full p-2 sm:p-4 h-full">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1">
          <div className="relative mb-3 w-full aspect-2/1 lg:aspect-5/3 overflow-hidden rounded-lg border border-default bg-foreground-muted/20 animate-pulse" />
          <div className="flex items-center space-x-1.5">
            <div className="h-4 w-24 bg-foreground-muted/20 rounded-sm animate-pulse" />
            <div className="h-4 w-4 bg-foreground-muted/20 rounded-sm animate-pulse" />
            <div className="h-4 w-16 bg-foreground-muted/20 rounded-sm animate-pulse" />
          </div>
          <div className="h-6 w-3/4 bg-foreground-muted/20 rounded-sm animate-pulse mt-1" />
          <div className="h-4 w-full bg-foreground-muted/20 rounded-sm animate-pulse mt-1" />
          <div className="h-4 w-2/3 bg-foreground-muted/20 rounded-sm animate-pulse" />
        </div>
      </div>
    </div>
  )
}

interface BlogClientProps {
  initialBlogs: any[]
  totalPosts: number
}

export default function BlogClient({ initialBlogs, totalPosts }: BlogClientProps) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterParams, setFilterParams] = useState<{ category?: string; search?: string }>({})
  const [filteredPosts, setFilteredPosts] = useState<any[] | null>(null)
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null)
  const isList = view === 'list'

  const currentPosts = filteredPosts ?? initialBlogs
  const currentTotal = filteredTotal ?? totalPosts

  const fetchMorePosts = useCallback(
    async (offset: number, limit: number) => {
      const isFiltered =
        (filterParams.category && filterParams.category !== 'all') || Boolean(filterParams.search)
      // The featured post is rendered above the list (not in `items`), so the
      // API offset has to skip past it for unfiltered fetches. Filtered
      // results come from a separate query and don't share that hero slot.
      const apiOffset = isFiltered ? offset : offset + 1

      const params = new URLSearchParams({
        offset: apiOffset.toString(),
        limit: limit.toString(),
      })

      if (filterParams.category && filterParams.category !== 'all') {
        params.set('category', filterParams.category)
      }
      if (filterParams.search) {
        params.set('q', filterParams.search)
      }

      const response = await fetch(`/api-v2/blog-posts?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch posts')
      }

      return data.posts
    },
    [filterParams]
  )

  const {
    items: blogs,
    setItems: setBlogs,
    hasMore,
    isLoading,
    loadMoreRef,
  } = useInfiniteScrollWithFetch({
    initialItems: currentPosts,
    totalItems: currentTotal,
    pageSize: POSTS_PER_PAGE,
    fetchMore: fetchMorePosts,
    rootMargin: '1000px',
  })

  const handleFilterChange = useCallback(async (category?: string, search?: string) => {
    if ((!category || category === 'all') && !search) {
      setFilterParams({})
      setFilteredPosts(null)
      setFilteredTotal(null)
      setIsFiltering(false)
      return
    }

    setIsFiltering(true)
    setFilterParams({ category, search })

    try {
      const params = new URLSearchParams({
        offset: '0',
        limit: POSTS_PER_PAGE.toString(),
      })

      if (category && category !== 'all') {
        params.set('category', category)
      }
      if (search) {
        params.set('q', search)
      }

      const response = await fetch(`/api-v2/blog-posts?${params}`)
      const data = await response.json()

      if (data.success) {
        setFilteredPosts(data.posts)
        setFilteredTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch filtered posts:', error)
    } finally {
      setIsFiltering(false)
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <BlogFilters onFilterChange={handleFilterChange} view={view} setView={setView} />
      </Suspense>

      <ol
        className={cn(
          'grid -mx-2 sm:-mx-4 py-6 lg:py-6 lg:pb-20',
          isList ? 'grid-cols-1' : 'grid-cols-12 lg:gap-4'
        )}
      >
        {isFiltering ? (
          isList ? (
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <div
                className="col-span-12 px-2 sm:px-4 [&_a]:last:border-none"
                key={`skeleton-list-${idx}`}
              >
                <BlogListItemSkeleton />
              </div>
            ))
          ) : (
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <div
                className="col-span-12 mb-4 md:col-span-12 lg:col-span-6 xl:col-span-4 h-full"
                key={`skeleton-grid-${idx}`}
              >
                <BlogGridItemSkeleton />
              </div>
            ))
          )
        ) : blogs?.length ? (
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

      {hasMore && !isFiltering && (
        <div ref={loadMoreRef} className="flex justify-center py-8" aria-hidden="true">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground-muted border-t-foreground" />
        </div>
      )}
    </>
  )
}
