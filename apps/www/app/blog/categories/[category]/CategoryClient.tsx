'use client'

import type { BlogView } from 'app/blog/BlogClient'
import { isBrowser, LOCAL_STORAGE_KEYS } from 'common'
import BlogFilters from 'components/Blog/BlogFilters'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { Suspense, useState } from 'react'
import type PostTypes from 'types/post'

export default function CategoryClient({ posts }: { posts: PostTypes[] }) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [view, setView] = useState<BlogView>(localView ?? 'list')
  const isList = view === 'list'

  return (
    <div>
      {/* Filters row — no onFilterChange, so categories navigate and search is hidden */}
      <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
          <div className="py-3">
            <Suspense fallback={null}>
              <BlogFilters view={view} setView={setView} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)]">
        {posts.length ? (
          isList ? (
            <div>
              {posts.map((post, idx) => (
                <BlogListItem post={post} key={`list-${idx}-${post.slug}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, idx) => (
                <BlogGridItem post={post} key={`grid-${idx}-${post.slug}`} />
              ))}
            </div>
          )
        ) : (
          <div className="px-6 py-12">
            <p className="text-sm text-light">No results</p>
          </div>
        )}
      </div>
    </div>
  )
}
