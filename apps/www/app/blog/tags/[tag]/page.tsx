import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import TagClient from './TagClient'
import { capitalize } from '@/lib/helpers'
import { getAllTags, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { tag: string }

export async function generateStaticParams() {
  const tags = getAllTags('_blog')
  return tags.map((tag: string) => ({ tag }))
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const params = await paramsPromise

  const capitalizedTag = capitalize(params?.tag.replaceAll('-', ' '))
  return {
    title: `Blog | ${capitalizedTag}`,
    description: 'Latest news from the Supabase team.',
  }
}

export default async function TagPage({ params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise

  const cookieStore = await cookies()
  const cookieView = cookieStore.get(BLOG_VIEW_COOKIE)?.value
  const initialView: BlogView = isBlogView(cookieView) ? cookieView : 'list'

  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0, tags: [params.tag] })
  const blogs = [...staticPosts] as PostTypes[]
  const capitalizedTag = capitalize(params?.tag.replaceAll('-', ' '))

  return <TagClient key={params.tag} posts={blogs} initialView={initialView} tag={capitalizedTag} />
}
