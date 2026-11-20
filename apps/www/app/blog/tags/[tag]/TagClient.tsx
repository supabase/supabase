'use client'

import { type BlogView } from 'app/blog/blog-view'
import BlogListingClient from 'components/Blog/BlogListingClient'
import Link from 'next/link'
import type PostTypes from 'types/post'

import SectionContainerWithCn from '@/components/Layouts/SectionContainerWithCn'

interface Props {
  posts: PostTypes[]
  initialView: BlogView
  tag: string
}

export default function TagClient({ posts, initialView, tag }: Props) {
  return (
    <>
      <SectionContainerWithCn height="narrow" className="space-y-6">
        <div className="text-foreground-lighter flex space-x-1">
          <nav aria-label="Breadcrumb" className="font-heading font-medium tracking-normal">
            <Link href="/blog">Blog</Link>
            <span className="px-2">/</span>
            <span>Tags</span>
            <span className="px-2">/</span>
            <span className="text-foreground">{tag}</span>
          </nav>
        </div>
      </SectionContainerWithCn>
      <BlogListingClient posts={posts} initialView={initialView} />
    </>
  )
}
