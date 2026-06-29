'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import BlogViewToggle from 'components/Blog/BlogViewToggle'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type PostTypes from 'types/post'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'ui'

import SectionContainerWithCn from '@/components/Layouts/SectionContainerWithCn'

interface Props {
  posts: PostTypes[]
  initialView: BlogView
  /**
   * When provided the component operates in controlled mode: the caller owns
   * the view and search state and the built-in filter bar is not rendered.
   */
  view?: BlogView
  searchTerm?: string
}

export default function BlogListingClient({
  posts,
  initialView,
  view: viewProp,
  searchTerm: searchTermProp,
}: Props) {
  const isControlled = viewProp !== undefined

  const [internalView, setInternalView] = useState<BlogView>(initialView)
  const [internalSearchTerm, setInternalSearchTerm] = useState('')

  const view = isControlled ? viewProp : internalView
  const searchTerm = isControlled ? (searchTermProp ?? '') : internalSearchTerm
  const isList = view === 'list'

  const visiblePosts = useMemo(() => {
    if (!searchTerm) return posts
    const term = searchTerm.toLowerCase()
    return posts.filter(
      (post) =>
        (post.title ?? '').toLowerCase().includes(term) ||
        (post.description ?? '').toLowerCase().includes(term) ||
        (post.author ?? '').toLowerCase().includes(term)
    )
  }, [posts, searchTerm])

  return (
    <>
      {!isControlled && (
        <div className="border-default border-t">
          <SectionContainerWithCn height="none" className="py-6">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex-1 max-w-[280px]">
                <InputGroup className="w-full">
                  <InputGroupInput
                    size="small"
                    autoComplete="off"
                    type="search"
                    placeholder="Search posts"
                    value={internalSearchTerm}
                    onChange={(e) => setInternalSearchTerm(e.target.value)}
                  />
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <BlogViewToggle view={internalView} setView={setInternalView} />
            </div>
          </SectionContainerWithCn>
        </div>
      )}

      <SectionContainerWithCn height="none">
        {visiblePosts.length > 0 ? (
          isList ? (
            <ul aria-label={`Blog posts, ${visiblePosts.length} total`}>
              {visiblePosts.map((post, idx) => (
                <li key={`list-${idx}-${post.slug}`}>
                  <BlogListItem post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <ul
              aria-label={`Blog posts, ${visiblePosts.length} total`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 py-4"
            >
              {visiblePosts.map((post, idx) => (
                <li key={`grid-${idx}-${post.slug}`}>
                  <BlogGridItem post={post} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="px-6 py-12">
            <p className="text-sm text-light">
              {searchTerm ? 'No posts matching your search.' : 'No posts found.'}
            </p>
          </div>
        )}
      </SectionContainerWithCn>
    </>
  )
}
