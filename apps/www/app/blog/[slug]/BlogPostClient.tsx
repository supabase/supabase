'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'

import authors from 'lib/authors.json'
import { CMS_SITE_ORIGIN } from 'lib/constants'
import { isNotNullOrUndefined } from 'lib/helpers'

import type { Blog, BlogData, CMSAuthor, PostReturnType, ProcessedBlogData, Tag } from 'types/post'

const BlogPostRenderer = dynamic(() => import('components/Blog/BlogPostRenderer'))

type BlogPostPageProps = {
  prevPost: PostReturnType | null
  nextPost: PostReturnType | null
  relatedPosts: (PostReturnType & BlogData)[]
  blog: Blog & BlogData
  isDraftMode: boolean
}

export default function BlogPostClient(props: BlogPostPageProps) {
  const isDraftMode = props.isDraftMode
  const [previewData] = useState<ProcessedBlogData>(props.blog)
  const shouldUseLivePreview = isDraftMode && (props.blog as any).isCMS

  const { data: livePreviewData, isLoading: isLivePreviewLoading } = useLivePreview({
    initialData: props.blog,
    serverURL: CMS_SITE_ORIGIN || 'http://localhost:3030',
    depth: 2,
  })

  const blogMetaData = useMemo(() => {
    if (isDraftMode && shouldUseLivePreview) {
      if (livePreviewData && typeof livePreviewData === 'object') {
        return { ...props.blog, ...livePreviewData }
      }
      if (previewData !== props.blog) {
        return previewData
      }
    }
    return props.blog
  }, [isDraftMode, shouldUseLivePreview, livePreviewData, previewData, props.blog]) as any

  const isCMS = (blogMetaData as any).isCMS
  const imageUrl = isCMS
    ? (blogMetaData as any).thumb ?? ''
    : (blogMetaData as any).thumb
      ? `/images/blog/${(blogMetaData as any).thumb}`
      : ''

  const meta = {
    title: (blogMetaData as any).meta_title ?? (blogMetaData as any).title,
    description: (blogMetaData as any).meta_description ?? (blogMetaData as any).description,
    url: `https://supabase.com/blog/${(blogMetaData as any).slug}`,
  }

  const processTag = (tag: any): string => {
    return typeof tag === 'string' ? tag : tag.name
  }

  const tags = (blogMetaData as any).tags
    ? Array.isArray((blogMetaData as any).tags)
      ? ((blogMetaData as any).tags as Tag[]).map(processTag)
      : []
    : []

  const blogAuthors = isCMS
    ? ((blogMetaData as any).authors as CMSAuthor[]) || []
    : ((blogMetaData as any).author as string)
        ?.split(',')
        .map((authorId: string) => {
          const foundAuthor = authors.find((author) => author.author_id === authorId)
          console.log('foundAuthor', foundAuthor)
          return foundAuthor ?? null
        })
        .filter(isNotNullOrUndefined) || []

  console.log('blogAuthors from client', blogAuthors)

  const authorUrls = (blogAuthors as any)
    .map((author: any) => author?.author_url)
    .filter(isNotNullOrUndefined)

  return (
    <>
      {/* Head metadata handled at layout/page level now */}
      <BlogPostRenderer
        blog={props.blog as any}
        blogMetaData={blogMetaData as any}
        isDraftMode={isDraftMode}
        isLivePreviewLoading={isLivePreviewLoading}
        prevPost={props.prevPost as any}
        nextPost={props.nextPost as any}
        authors={blogAuthors as any}
      />
    </>
  )
}
