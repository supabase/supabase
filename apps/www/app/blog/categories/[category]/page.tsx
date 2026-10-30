import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import CategoryClient from './CategoryClient'
import { canonicalAlternates } from '@/lib/canonical'
import { decodeRouteParam, startCase } from '@/lib/helpers'
import { getAllCategories, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { category: string }

// Category list is fixed per deploy, so read it once per process instead of per request.
let knownCategories: string[] | undefined
const getKnownCategories = (): string[] => (knownCategories ??= getAllCategories('_blog'))

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const params = await paramsPromise
  const category = decodeRouteParam(params.category)

  const categoryLabel = startCase(category.replaceAll('-', ' '))
  // The page calls notFound() for unknown categories, so no canonical for them.
  const isKnownCategory = getKnownCategories().includes(category)
  return {
    title: `Blog | ${categoryLabel}`,
    description: `Blog posts in ${categoryLabel}.`,
    alternates: isKnownCategory
      ? canonicalAlternates(`/blog/categories/${encodeURIComponent(category)}`)
      : undefined,
  }
}

export default async function CategoriesPage({
  params: paramsPromise,
}: {
  params: Promise<Params>
}) {
  const params = await paramsPromise
  const category = decodeRouteParam(params.category)

  if (!getKnownCategories().includes(category)) {
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
    categories: [category],
  })
  const blogs = [...staticPosts] as PostTypes[]

  // Key by category so state (search term, view) resets when switching between
  // category pages rather than persisting across the reused page component.
  return <CategoryClient key={category} posts={blogs} initialView={initialView} />
}
