import BlogClient from './BlogClient'
import { getSortedPosts } from 'lib/posts'
import type { Metadata } from 'next'

export const dynamic = 'force-static'

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

export default async function BlogPage() {
  // Get static blog posts at build time only
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  // Pass only static posts to client - CMS posts will be fetched at runtime
  return <BlogClient blogs={staticPostsData as any} />
}
