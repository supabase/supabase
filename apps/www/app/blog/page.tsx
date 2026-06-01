import type { Metadata } from 'next'

import BlogClient from './BlogClient'
import { breadcrumbs } from '@/lib/breadcrumbs'
import { breadcrumbListSchema, serializeJsonLd } from '@/lib/json-ld'
import { getSortedPosts } from '@/lib/posts'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Supabase Blog: the Postgres development platform',
  description: 'Get all your Supabase News on the Supabase blog.',
  openGraph: {
    title: 'Supabase Blog: the Postgres development platform',
    description: 'Get all your Supabase News on the Supabase blog.',
    url: 'https://supabase.com/blog',
    images: [{ url: 'https://supabase.com/images/og/supabase-og.png' }],
  },
}

const INITIAL_POSTS_LIMIT = 25

export default async function BlogPage() {
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  const allPosts = [...staticPostsData].sort((a, b) => {
    const dateA = new Date(a.date || a.formattedDate).getTime()
    const dateB = new Date(b.date || b.formattedDate).getTime()
    return dateB - dateA
  })

  // The featured post + secondary spotlights are derived from the head of this
  // list inside BlogClient; chrome (nav, footer, container) comes from the blog
  // route's layout.tsx.
  const initialPosts = allPosts.slice(0, INITIAL_POSTS_LIMIT)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbListSchema(breadcrumbs.blogIndex)),
        }}
      />
      <BlogClient initialBlogs={initialPosts} totalPosts={allPosts.length} />
    </>
  )
}
