import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import CategoryClient from './CategoryClient'
import { capitalize } from '@/lib/helpers'
import { getAllCategories, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { category: string }

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const params = await paramsPromise

  const capitalizedCategory = capitalize(params?.category.replaceAll('-', ' '))
  return {
    title: `Blog | ${capitalizedCategory}`,
    description: 'Latest news from the Supabase team.',
  }
}

export default async function CategoriesPage({
  params: paramsPromise,
}: {
  params: Promise<Params>
}) {
  const params = await paramsPromise

  if (!getAllCategories('_blog').includes(params.category)) {
    notFound()
  }

  // Read the list/grid preference from a cookie so the correct view renders on
  // first paint. Reading a cookie opts this route into dynamic rendering.
  const cookieStore = await cookies()
  const cookieView = cookieStore.get(BLOG_VIEW_COOKIE)?.value
  const initialView: BlogView = isBlogView(cookieView) ? cookieView : 'list'

  const staticPosts = getSortedPosts({
    directory: '_blog',
    limit: 0,
    categories: [params.category],
  })
  const blogs = [...staticPosts] as PostTypes[]

  const capitalizedCategory = capitalize(params.category.replaceAll('-', ' '))

  // Key by category so state (search term, view) resets when switching between
  // category pages rather than persisting across the reused page component.
  return (
    <CategoryClient
      key={params.category}
      posts={blogs}
      initialView={initialView}
      category={capitalizedCategory}
    />
  )
}
