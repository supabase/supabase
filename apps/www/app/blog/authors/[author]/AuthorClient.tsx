'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DefaultLayout from 'components/Layouts/Default'
import BlogGridItem from 'components/Blog/BlogGridItem'
import BlogListItem from 'components/Blog/BlogListItem'
import { cn, Button, Input } from 'ui'
import { LOCAL_STORAGE_KEYS, isBrowser } from 'common'
import { AlignJustify, Grid, Search } from 'lucide-react'

import type PostTypes from 'types/post'

export type BlogView = 'list' | 'grid'

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
}

export default function AuthorClient({ author, authorId, blogs }: AuthorClientProps) {
  const { BLOG_VIEW } = LOCAL_STORAGE_KEYS
  const localView = isBrowser ? (localStorage?.getItem(BLOG_VIEW) as BlogView) : undefined
  const [view, setView] = useState<BlogView>(localView ?? 'list')
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

  const handleViewSelection = () => {
    setView((prevView) => {
      const newValue = prevView === 'list' ? 'grid' : 'list'
      localStorage.setItem(BLOG_VIEW, newValue)
      return newValue
    })
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
        <div className="text-foreground-lighter flex space-x-1 mb-8">
          <h1 className="cursor-pointer">
            <Link href="/blog">Blog</Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{author?.author ?? authorId}</span>
          </h1>
        </div>

        {author && (
          <div className="flex items-center gap-6 pb-8">
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

      <div className="border-default border-t">
        <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
          <div className="flex flex-row items-center justify-between gap-2 mb-6">
            <div className="flex-1 max-w-[280px]">
              <Input
                icon={<Search size="14" />}
                size="small"
                layout="vertical"
                autoComplete="off"
                type="search"
                placeholder="Search posts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              type="default"
              title={isList ? 'Grid View' : 'List View'}
              onClick={handleViewSelection}
              className="h-full p-2 text-foreground-light"
            >
              {isList ? (
                <Grid className="w-4 h-4 stroke-1.5" />
              ) : (
                <AlignJustify className="w-4 h-4 stroke-1.5" />
              )}
            </Button>
          </div>

          {filteredBlogs.length > 0 ? (
            <ol
              className={cn(
                'grid -mx-2 sm:-mx-4 py-6 lg:py-6 lg:pb-20',
                isList ? 'grid-cols-1' : 'grid-cols-12 lg:gap-4'
              )}
            >
              {filteredBlogs.map((blog: PostTypes, idx: number) =>
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
              )}
            </ol>
          ) : (
            <p className="text-foreground-lighter py-8">
              {searchTerm
                ? 'No posts found matching your search.'
                : 'No posts found by this author.'}
            </p>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
