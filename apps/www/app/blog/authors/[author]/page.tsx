import type { Metadata } from 'next'

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

export async function generateStaticParams() {
  return blogAuthors.map((author) => ({ author: author.author_id }))
}

export const revalidate = 30
export const dynamic = 'force-static'

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

  // Get static posts where author field contains this author_id (normalize identifiers)
  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0 }).filter((post: any) => {
    const postAuthors = post.author?.split(',').map((a: string) => a.trim()) || []
    return postAuthors.some((a: string) => toCanonicalAuthorId(a) === authorId)
  })

  const blogs = [...(staticPosts as any[])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ) as unknown as PostTypes[]

  return <AuthorClient author={author} authorId={authorId} blogs={blogs} />
}
