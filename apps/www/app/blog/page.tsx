import type { Metadata } from 'next'

import BlogClient from './BlogClient'
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
  // Get static blog posts
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  // Sort by date
  const allPosts = [...staticPostsData].sort((a, b) => {
    const dateA = new Date(a.date || a.formattedDate).getTime()
    const dateB = new Date(b.date || b.formattedDate).getTime()
    return dateB - dateA
  })

  // Only send initial posts to client, rest will be loaded via API
  const initialPosts = allPosts.slice(0, INITIAL_POSTS_LIMIT)
  const totalPosts = allPosts.length

  return <BlogClient initialBlogs={initialPosts} totalPosts={totalPosts} />
}
