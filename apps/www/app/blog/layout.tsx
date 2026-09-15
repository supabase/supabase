import BlogLayoutShell from './BlogLayoutShell'
import { getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  // Fetched once in the (persistent) layout so the featured hero survives
  // navigation between blog routes and can animate its height on change.
  const staticPosts = getSortedPosts({ directory: '_blog' })
  const sorted = [...staticPosts].sort((a, b) => {
    const aDate = new Date(a.date || a.formattedDate).getTime()
    const bDate = new Date(b.date || b.formattedDate).getTime()
    return bDate - aDate
  })

  const featuredPost = (sorted[0] ?? null) as PostTypes | null
  const secondaryPosts = sorted.slice(1, 3) as PostTypes[]

  return (
    <BlogLayoutShell featuredPost={featuredPost} secondaryPosts={secondaryPosts}>
      {children}
    </BlogLayoutShell>
  )
}
