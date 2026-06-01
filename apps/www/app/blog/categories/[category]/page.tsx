import type { Metadata } from 'next'

import CategoryClient from './CategoryClient'
import { capitalize } from '@/lib/helpers'
import { getAllCategories, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { category: string }

export async function generateStaticParams() {
  const categories = getAllCategories('_blog')
  return categories.map((category: string) => ({ category }))
}

export const revalidate = 30
export const dynamic = 'force-static'

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

  const staticPosts = getSortedPosts({
    directory: '_blog',
    limit: 0,
    categories: [params.category],
  })
  const blogs = [...staticPosts] as PostTypes[]

  return <CategoryClient posts={blogs} />
}
