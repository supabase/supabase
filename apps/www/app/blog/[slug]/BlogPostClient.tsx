'use client'

import dynamic from 'next/dynamic'

import useActiveAnchors from '@/hooks/useActiveAnchors'
import authors from '@/lib/authors.json'
import { isNotNullOrUndefined } from '@/lib/helpers'
import type { Blog, BlogData, PostReturnType, ProcessedBlogData } from '@/types/post'

const BlogPostRenderer = dynamic(() => import('@/components/Blog/BlogPostRenderer'))

type BlogPostPageProps = {
  prevPost: PostReturnType | null
  nextPost: PostReturnType | null
  relatedPosts: (PostReturnType & BlogData)[]
  blog: Blog & BlogData
  isDraftMode: boolean
}

// Note: convertRichTextToMarkdown is now imported from the shared utility

export default function BlogPostClient(props: BlogPostPageProps) {
  const isDraftMode = props.isDraftMode

  // Enable scroll-to-anchor functionality and TOC highlighting
  useActiveAnchors()

  const blogMetaData = props.blog

  const blogAuthors = (blogMetaData.author ?? '')
    ?.split(',')
    .map((authorId) => authorId.trim())
    .filter(Boolean)
    .map((authorId) => {
      const foundAuthor = authors.find((author) => author.author_id === authorId)
      return foundAuthor ?? null
    })
    .filter(isNotNullOrUndefined)

  return (
    <BlogPostRenderer
      blog={props.blog as ProcessedBlogData}
      blogMetaData={blogMetaData as ProcessedBlogData}
      isDraftMode={isDraftMode}
      prevPost={props.prevPost}
      nextPost={props.nextPost}
      authors={blogAuthors}
    />
  )
}
