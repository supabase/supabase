'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import type PostTypes from 'types/post'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'ui'

import BlogFilters from '../../../../components/Blog/BlogFilters'
import SectionContainer from '../../../../components/Layouts/SectionContainer'

interface Author {
  author_id: string
  author: string
  position?: string
  author_url?: string
  author_image_url?: string
}

interface AuthorClientProps {
  author: Author | null
  authorId: string
  blogs: PostTypes[]
  initialView: BlogView
}

export default function AuthorClient({ author, authorId, blogs, initialView }: AuthorClientProps) {
  const [view, setView] = useState<BlogView>(initialView)
  const [searchTerm, setSearchTerm] = useState('')
  const isList = view === 'list'

  const filteredBlogs = useMemo(() => {
    if (!searchTerm) return blogs
    const term = searchTerm.toLowerCase()
    return blogs.filter(
      (blog) =>
        (blog.title ?? '').toLowerCase().includes(term) ||
        (blog.description ?? '').toLowerCase().includes(term)
    )
  }, [blogs, searchTerm])

  return (
    <div>
      {/* Header */}
      <div className="mx-auto max-w-(--container-max-w,75rem) px-6 pt-8 md:pt-12 pb-8">
        <div className="text-foreground-lighter flex space-x-1 mb-8">
          <h1 className="cursor-pointer">
            <Link href="/blog">Blog</Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{author?.author ?? authorId}</span>
          </h1>
        </div>

        {author && (
          <div className="flex items-center gap-6">
            {author.author_image_url && (
              <Image
                src={author.author_image_url}
                alt={`${author.author} avatar`}
                width={80}
                height={80}
                className="rounded-full border border-default"
              />
            )}
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl text-foreground">{author.author}</h2>
              {author.position && <p className="text-foreground-light">{author.position}</p>}
              {author.author_url && (
                <Link
                  href={author.author_url}
                  target="_blank"
                  className="text-brand hover:underline text-sm"
                >
                  {author.author_url.includes('github.com')
                    ? 'GitHub'
                    : author.author_url.includes('twitter.com') ||
                        author.author_url.includes('x.com')
                      ? 'Twitter'
                      : author.author_url.includes('linkedin.com')
                        ? 'LinkedIn'
                        : 'Website'}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters row — divider above the header, search aligned with the view toggle */}
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
      <div className="mx-auto max-w-(--container-max-w,75rem)">
        {filteredBlogs.length > 0 ? (
          isList ? (
            <div>
              {filteredBlogs.map((blog, idx) => (
                <BlogListItem post={blog} key={`list-${idx}-${blog.slug}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((blog, idx) => (
                <BlogGridItem post={blog} key={`grid-${idx}-${blog.slug}`} />
              ))}
            </div>
          )
        ) : (
          <div className="px-6 py-12">
            <p className="text-sm text-light">
              {searchTerm
                ? 'No posts found matching your search.'
                : 'No posts found by this author.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
