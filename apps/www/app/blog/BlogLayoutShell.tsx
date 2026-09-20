'use client'

import { usePathname } from 'next/navigation'
import type PostTypes from 'types/post'

import BlogHero from './BlogHero'
import DefaultLayout from '@/components/Layouts/Default'

// Listing routes have no page-specific title of their own, so they share the
// generic screen-reader heading below. Without it the visible breadcrumb ends up
// as the only heading on the page, and search engines pick that up as the title.
const LISTING_ROUTE_PREFIXES = ['/blog/categories/', '/blog/tags/', '/blog/authors/']

export default function BlogLayoutShell({
  featuredPost,
  secondaryPosts,
  children,
}: {
  featuredPost: PostTypes | null
  secondaryPosts: PostTypes[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isListingRoute =
    pathname === '/blog' || LISTING_ROUTE_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  return (
    <DefaultLayout>
      {isListingRoute && <h1 className="sr-only">Supabase Blog</h1>}
      <BlogHero featuredPost={featuredPost} secondaryPosts={secondaryPosts} />
      {children}
    </DefaultLayout>
  )
}
