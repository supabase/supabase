import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import TagClient from './TagClient'
import { canonicalAlternates } from '@/lib/canonical'
import { decodeRouteParam, startCase } from '@/lib/helpers'
import { getAllTags, getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { tag: string }

// Tag list is fixed per deploy, so read it once per process instead of per request.
let knownTags: string[] | undefined
const getKnownTags = (): string[] => (knownTags ??= getAllTags('_blog'))

// Shared by the metadata title and the visible breadcrumb so the two never
// disagree. Matches the casing the blog filter chips use.
const toTagLabel = (tag: string) => startCase(tag.replaceAll('-', ' '))

export async function generateStaticParams() {
  return getKnownTags().map((tag: string) => ({ tag }))
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const params = await paramsPromise
  const tag = decodeRouteParam(params.tag)

  const tagLabel = toTagLabel(tag)
  // Unknown tags still render (200), so skip the canonical rather than point it at a thin page.
  const isKnownTag = getKnownTags().includes(tag)
  return {
    title: `Blog | ${tagLabel}`,
    description: `Blog posts tagged ${tagLabel}.`,
    alternates: isKnownTag
      ? canonicalAlternates(`/blog/tags/${encodeURIComponent(tag)}`)
      : undefined,
  }
}

export default async function TagPage({ params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise
  const tag = decodeRouteParam(params.tag)

  const cookieStore = await cookies()
  const cookieView = cookieStore.get(BLOG_VIEW_COOKIE)?.value
  const initialView: BlogView = isBlogView(cookieView) ? cookieView : 'list'

  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0, tags: [tag] })
  const blogs = [...staticPosts] as PostTypes[]

  return <TagClient key={tag} posts={blogs} initialView={initialView} tag={toTagLabel(tag)} />
}
