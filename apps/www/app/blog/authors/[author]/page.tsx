import { BLOG_VIEW_COOKIE, isBlogView, type BlogView } from 'app/blog/blog-view'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import AuthorClient from './AuthorClient'
import blogAuthors from '@/lib/authors.json'
import { getSortedPosts } from '@/lib/posts'
import type PostTypes from '@/types/post'

type Params = { author: string }

// Build a lookup map from any identifier (author_id or username) to canonical author_id
const authorIdLookup = new Map<string, string>()
for (const author of blogAuthors) {
  authorIdLookup.set(author.author_id, author.author_id)
  if ('username' in author && author.username) {
    authorIdLookup.set(author.username, author.author_id)
  }
}

// Normalize any author identifier to the canonical author_id
function toCanonicalAuthorId(identifier: string): string {
  return authorIdLookup.get(identifier) ?? identifier
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const params = await paramsPromise
  const author = blogAuthors.find((a) => a.author_id === params.author)

  return {
    title: author ? `Blog | ${author.author}` : 'Blog | Author',
    description: author ? `Blog posts by ${author.author}` : 'Latest news from the Supabase team.',
  }
}

export default async function AuthorPage({ params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise
  const authorId = params.author

  const author = blogAuthors.find((a) => a.author_id === authorId) ?? null
  if (!author) {
    notFound()
  }

  // Read the list/grid preference from a cookie so the correct view renders on
  // first paint. Reading a cookie opts this route into dynamic rendering.
  const cookieStore = await cookies()
  const cookieView = cookieStore.get(BLOG_VIEW_COOKIE)?.value
  const initialView: BlogView = isBlogView(cookieView) ? cookieView : 'list'

  // Get static posts where author field contains this author_id (normalize identifiers)
  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0 }).filter((post: any) => {
    const postAuthors = post.author?.split(',').map((a: string) => a.trim()) || []
    return postAuthors.some((a: string) => toCanonicalAuthorId(a) === authorId)
  })

  const blogs = [...(staticPosts as any[])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ) as unknown as PostTypes[]

  return (
    <AuthorClient
      key={authorId}
      author={author}
      authorId={authorId}
      blogs={blogs}
      initialView={initialView}
    />
  )
}
