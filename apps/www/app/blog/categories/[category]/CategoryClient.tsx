'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogFilters from 'components/Blog/BlogFilters'
import BlogListingClient from 'components/Blog/BlogListingClient'
import { Suspense, useState } from 'react'
import type PostTypes from 'types/post'

import SectionContainer from '@/components/Layouts/SectionContainer'

interface Props {
  posts: PostTypes[]
  initialView: BlogView
  category: string
}

export default function CategoryClient({ posts, initialView, category: _category }: Props) {
  const [view, setView] = useState<BlogView>(initialView)
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <>
      <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <SectionContainer className="py-3!">
          <Suspense fallback={null}>
            <BlogFilters view={view} setView={setView} onSearch={setSearchTerm} />
          </Suspense>
        </SectionContainer>
      </div>

      <div className="my-6">
        <BlogListingClient
          posts={posts}
          initialView={initialView}
          view={view}
          searchTerm={searchTerm}
        />
      </div>
    </>
  )
}
