'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogFilters from 'components/Blog/BlogFilters'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { useInfiniteScrollWithFetch } from 'hooks/useInfiniteScroll'
import { Suspense, useCallback, useState } from 'react'
import type PostTypes from 'types/post'

import SectionContainerWithCn from '../../components/Layouts/SectionContainerWithCn'
import SectionContainer from '@/components/Layouts/SectionContainer'

const POSTS_PER_PAGE = 25
const SKELETON_COUNT = 6
// Featured + 2 secondary posts shown by the layout hero on the index. Excluded
// from the list to avoid duplication — keep in sync with app/blog/layout.tsx.
const HERO_POST_COUNT = 3

function BlogListItemSkeleton() {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-10 xl:grid-cols-12 w-full py-2 sm:py-4 h-full">
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
    <div className="flex flex-col gap-2 p-6">
      <div className="relative w-full aspect-[1.91/1] overflow-hidden bg-foreground-muted/20 animate-pulse" />
      <div className="flex items-center space-x-1.5 mt-2">
        <div className="h-4 w-24 bg-foreground-muted/20 rounded animate-pulse" />
        <div className="h-4 w-4 bg-foreground-muted/20 rounded animate-pulse" />
        <div className="h-4 w-16 bg-foreground-muted/20 rounded animate-pulse" />
      </div>
      <div className="h-6 w-3/4 bg-foreground-muted/20 rounded animate-pulse mt-1" />
      <div className="h-4 w-full bg-foreground-muted/20 rounded animate-pulse mt-1" />
      <div className="h-4 w-2/3 bg-foreground-muted/20 rounded animate-pulse" />
    </div>
  )
}

interface BlogClientProps {
  initialBlogs: any[]
  totalPosts: number
  initialView: BlogView
}

export default function BlogClient({ initialBlogs, totalPosts, initialView }: BlogClientProps) {
  const [view, setView] = useState<BlogView>(initialView)
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterParams, setFilterParams] = useState<{ category?: string; search?: string }>({})
  const [filteredPosts, setFilteredPosts] = useState<any[] | null>(null)
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null)
  const isList = view === 'list'

  const currentPosts = filteredPosts ?? initialBlogs
  const currentTotal = filteredTotal ?? totalPosts

  const fetchMorePosts = useCallback(
    async (offset: number, limit: number) => {
      // The hero posts stay in the loaded array (just rendered in the layout
      // hero, sliced off at render), so `offset` already counts them — no skip.
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      })

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
    hasMore,
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

  // The hero posts (the most recent HERO_POST_COUNT) are rendered by the blog
  // layout's hero, so drop them from the list to avoid duplication. Filtered
  // results are a separate query with no hero, so show all.
  const visibleBlogs = filteredPosts !== null ? blogs : blogs.slice(HERO_POST_COUNT)

  return (
    <div>
      {/* Filters row */}
      <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <SectionContainer className="py-0!">
          <div className="py-3">
            <Suspense fallback={null}>
              <BlogFilters onFilterChange={handleFilterChange} view={view} setView={setView} />
            </Suspense>
          </div>
        </SectionContainer>
      </div>

      {/* Blog posts */}
      <SectionContainerWithCn height="none" className="py-6">
        {isFiltering ? (
          isList ? (
            <div>
              {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <BlogListItemSkeleton key={`skeleton-list-${idx}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <div key={`skeleton-grid-${idx}`}>
                  <BlogGridItemSkeleton />
                </div>
              ))}
            </div>
          )
        ) : visibleBlogs?.length ? (
          isList ? (
            <ul aria-label={`Blog posts, ${currentTotal} total`}>
              {visibleBlogs.map((blog: PostTypes, idx: number) => (
                <li key={`list-${idx}-${blog.slug}`}>
                  <BlogListItem post={blog} />
                </li>
              ))}
            </ul>
          ) : (
            <ul
              aria-label={`Blog posts, ${currentTotal} total`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 py-4"
            >
              {visibleBlogs.map((blog: PostTypes, idx: number) => (
                <li key={`grid-${idx}-${blog.slug}`}>
                  <BlogGridItem post={blog} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="px-6 py-12">
            <p className="text-sm text-light">No results</p>
          </div>
        )}

        {hasMore && !isFiltering && (
          <div ref={loadMoreRef} className="flex justify-center py-8" aria-hidden="true">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground-muted border-t-foreground" />
          </div>
        )}
      </SectionContainerWithCn>
    </div>
  )
}
