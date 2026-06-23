'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogFilters from 'components/Blog/BlogFilters'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { Suspense, useMemo, useState } from 'react'
import type PostTypes from 'types/post'

import SectionContainer from '@/components/Layouts/SectionContainer'

export default function CategoryClient({
  posts,
  initialView,
}: {
  posts: PostTypes[]
  initialView: BlogView
}) {
  const [view, setView] = useState<BlogView>(initialView)
  const [searchTerm, setSearchTerm] = useState('')
  const isList = view === 'list'

  // In-category search: filter the (already loaded) posts client-side.
  const visiblePosts = useMemo(() => {
    if (!searchTerm) return posts
    const term = searchTerm.toLowerCase()
    return posts.filter(
      (post) =>
        (post.title ?? '').toLowerCase().includes(term) ||
        (post.description ?? '').toLowerCase().includes(term)
    )
  }, [posts, searchTerm])

  return (
    <div>
      {/* Filters row — categories navigate; search filters within this category */}
      <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <SectionContainer className="py-3!">
          <Suspense fallback={null}>
            <BlogFilters
              view={view}
              setView={setView}
              onFilterChange={(_, search) => setSearchTerm(search ?? '')}
            />
          </Suspense>
        </SectionContainer>
      </div>

      {/* Posts */}
      <SectionContainer>
        {visiblePosts.length ? (
          isList ? (
            <div>
              {visiblePosts.map((post, idx) => (
                <BlogListItem post={post} key={`list-${idx}-${post.slug}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((post, idx) => (
                <BlogGridItem post={post} key={`grid-${idx}-${post.slug}`} />
              ))}
            </div>
          )
        ) : (
          <div className="px-6 py-12">
            <p className="text-sm text-light">No results</p>
          </div>
        )}
      </SectionContainer>
    </div>
  )
}
