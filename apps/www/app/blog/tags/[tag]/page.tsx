import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import TagClient from './TagClient'
import { startCase } from '@/lib/helpers'
import { getAllTags, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { tag: string }

// Shared by the metadata title and the visible breadcrumb so the two never
// disagree. Matches the casing the blog filter chips use.
const toTagLabel = (tag: string) => startCase(tag.replaceAll('-', ' '))

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

  const tagLabel = toTagLabel(params.tag)
  return {
    title: `Blog | ${tagLabel}`,
    description: `Blog posts tagged ${tagLabel}.`,
  }
}

export default async function TagPage({ params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise

  const cookieStore = await cookies()
  const cookieView = cookieStore.get(BLOG_VIEW_COOKIE)?.value
  const initialView: BlogView = isBlogView(cookieView) ? cookieView : 'list'

  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0, tags: [params.tag] })
  const blogs = [...staticPosts] as PostTypes[]

  return (
    <TagClient
      key={params.tag}
      posts={blogs}
      initialView={initialView}
      tag={toTagLabel(params.tag)}
    />
  )
}
