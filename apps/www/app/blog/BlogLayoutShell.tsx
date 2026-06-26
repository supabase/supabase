'use client'

import Footer from '~/components/Footer'
import Nav from '~/components/Nav'
import { useForceDeepDark } from 'lib/theme.utils'
import { usePathname } from 'next/navigation'
import type PostTypes from 'types/post'

import BlogHero from './BlogHero'

export default function BlogLayoutShell({
  featuredPost,
  secondaryPosts,
  children,
}: {
  featuredPost: PostTypes | null
  secondaryPosts: PostTypes[]
  children: React.ReactNode
}) {
  useForceDeepDark()

  const pathname = usePathname()
  const isListingRoute = pathname === '/blog' || Boolean(pathname?.startsWith('/blog/categories/'))

  return (
    <>
      <Nav hideNavbar={false} />
      <div className="relative w-full [--container-max-w:75rem]">
        {isListingRoute && <h1 className="sr-only">Supabase Blog</h1>}
        <BlogHero featuredPost={featuredPost} secondaryPosts={secondaryPosts} />
        <main className="relative min-h-screen">{children}</main>
      </div>
      <Footer />
    </>
  )
}
