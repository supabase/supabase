'use client'

import Footer from '~/components/Footer'
import Nav from '~/components/Nav'
import { useForceDeepDark } from 'lib/theme.utils'
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

  return (
    <>
      <Nav hideNavbar={false} />
      <div className="relative w-full [--container-max-w:75rem]">
        <BlogHero featuredPost={featuredPost} secondaryPosts={secondaryPosts} />
        <main className="relative min-h-screen">{children}</main>
      </div>
      <Footer />
    </>
  )
}
