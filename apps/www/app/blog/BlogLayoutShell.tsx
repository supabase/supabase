'use client'

import { usePathname } from 'next/navigation'
import type PostTypes from 'types/post'

import BlogHero from './BlogHero'
import DefaultLayout from '@/components/Layouts/Default'

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
  const isListingRoute = pathname === '/blog' || Boolean(pathname?.startsWith('/blog/categories/'))

  return (
    <DefaultLayout>
      {isListingRoute && <h1 className="sr-only">Supabase Blog</h1>}
      <BlogHero featuredPost={featuredPost} secondaryPosts={secondaryPosts} />
      {children}
    </DefaultLayout>
  )
}
