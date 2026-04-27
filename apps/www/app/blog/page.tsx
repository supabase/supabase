import FeaturedThumb from 'components/Blog/FeaturedThumb'
import DefaultLayout from 'components/Layouts/Default'
import type { Metadata } from 'next'
import type PostTypes from 'types/post'

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
  const staticPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })

  const allPosts = [...staticPostsData].sort((a, b) => {
    const dateA = new Date(a.date || a.formattedDate).getTime()
    const dateB = new Date(b.date || b.formattedDate).getTime()
    return dateB - dateA
  })

  const initialPosts = allPosts.slice(0, INITIAL_POSTS_LIMIT)
  const featuredPost = initialPosts[0]
  // Featured post is rendered as the hero above the list, so exclude it from
  // the list to avoid showing it twice. BlogClient compensates the API offset
  // when scrolling for more posts.
  const listPosts = initialPosts.slice(1)
  const totalListPosts = Math.max(0, allPosts.length - 1)

  return (
    <DefaultLayout>
      <h1 className="sr-only">Supabase blog</h1>
      <div className="container relative mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
        {featuredPost && <FeaturedThumb key={featuredPost.slug} {...(featuredPost as PostTypes)} />}
      </div>

      <div className="border-default border-t">
        <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
          <BlogClient initialBlogs={listPosts} totalPosts={totalListPosts} />
        </div>
      </div>
    </DefaultLayout>
  )
}
