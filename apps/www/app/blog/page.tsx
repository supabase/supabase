import BlogClient from './BlogClient'
import { getSortedPosts } from 'lib/posts'
import { getAllCMSPosts } from 'lib/get-cms-posts'
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
  // Get static blog posts at build time
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })
  const cmsPosts = await getAllCMSPosts()

  const allPostsData = [...staticPostsData, ...cmsPosts].sort((a: any, b: any) => {
    const dateA = (a as any).date
      ? new Date((a as any).date).getTime()
      : new Date((a as any).formattedDate).getTime()
    const dateB = (b as any).date
      ? new Date((b as any).date).getTime()
      : new Date((b as any).formattedDate).getTime()
    return dateB - dateA
  })

  // RSS writing moved out of runtime to avoid tracing the entire public directory into serverless bundles

  return <BlogClient blogs={allPostsData as any} />
}
