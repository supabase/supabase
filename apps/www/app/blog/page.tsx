import BlogClient from './BlogClient'
import { getSortedPosts } from 'lib/posts'
import { getAllCMSPosts } from 'lib/get-cms-posts'
import type { Metadata } from 'next'

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

export default async function BlogPage() {
  // Get static blog posts
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  // Get CMS posts server-side with revalidation
  const cmsPostsData = await getAllCMSPosts({ limit: 100 })

  // Combine static and CMS posts and sort by date
  const allPosts = [...staticPostsData, ...cmsPostsData].sort((a: any, b: any) => {
    const dateA = new Date(a.date || a.formattedDate).getTime()
    const dateB = new Date(b.date || b.formattedDate).getTime()
    return dateB - dateA
  })

  return <BlogClient blogs={allPosts} />
}
