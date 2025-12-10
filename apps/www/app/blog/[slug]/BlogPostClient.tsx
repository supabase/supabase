'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'

import authors from 'lib/authors.json'
import { CMS_SITE_ORIGIN } from 'lib/constants'
import { isBrowser, isNotNullOrUndefined } from 'lib/helpers'
import { generateTocFromMarkdown } from 'lib/toc'
import { convertRichTextToMarkdown } from '~/lib/cms/convertRichTextToMarkdown'

import type { Blog, BlogData, CMSAuthor, PostReturnType, ProcessedBlogData } from 'types/post'

const BlogPostRenderer = dynamic(() => import('components/Blog/BlogPostRenderer'))

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
  const [previewData] = useState<ProcessedBlogData>(props.blog)
  const [processedToc, setProcessedToc] = useState<{ content: string; json: any[] } | null>(null)
  const shouldUseLivePreview = isDraftMode && 'isCMS' in props.blog && props.blog.isCMS
  const hasScrolledToHash = useRef(false)

  const { data: livePreviewData, isLoading: isLivePreviewLoading } = useLivePreview({
    initialData: props.blog,
    serverURL: CMS_SITE_ORIGIN || 'http://localhost:3030',
    depth: 2,
  })

  // Handle scrolling to anchor link on initial page load
  // This is needed because the content is dynamically loaded and the browser's
  // native hash scrolling happens before the target element exists
  useEffect(() => {
    if (!isBrowser || hasScrolledToHash.current) return

    const hash = window.location.hash
    if (!hash) return

    const targetId = hash.slice(1) // Remove the leading #
    if (!targetId) return

    const scrollToTarget = (element: HTMLElement) => {
      hasScrolledToHash.current = true
      // Small delay to ensure layout is complete
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth' })
      })
    }

    // Check if element already exists (in case of fast render)
    const existingElement = document.getElementById(targetId)
    if (existingElement) {
      scrollToTarget(existingElement)
      return
    }

    // Use a MutationObserver to wait for the target element to appear in the DOM
    const observer = new MutationObserver(() => {
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        observer.disconnect()
        scrollToTarget(targetElement)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Cleanup timeout to prevent indefinite observation
    const timeoutId = setTimeout(() => {
      observer.disconnect()
    }, 5000)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  // Generate TOC for LivePreview data when content changes
  useEffect(() => {
    if (isDraftMode && shouldUseLivePreview && livePreviewData?.content) {
      // Check if content is rich text (object) or already converted to markdown (string)
      let markdownContent = ''
      if (typeof livePreviewData.content === 'string') {
        markdownContent = livePreviewData.content
      } else if (typeof livePreviewData.content === 'object') {
        markdownContent = convertRichTextToMarkdown(livePreviewData.content)
      }

      if (markdownContent) {
        const tocDepth = (livePreviewData as any).toc_depth || (props.blog as any).toc_depth || 3

        generateTocFromMarkdown(markdownContent, tocDepth)
          .then((tocResult) => {
            setProcessedToc(tocResult)
          })
          .catch((error) => {
            console.error('Error generating TOC:', error)
            setProcessedToc(null)
          })
      }
    }
  }, [
    isDraftMode,
    shouldUseLivePreview,
    livePreviewData?.content,
    livePreviewData?.toc_depth,
    props.blog.toc_depth,
  ])

  const blogMetaData = useMemo(() => {
    if (isDraftMode && shouldUseLivePreview) {
      if (livePreviewData && typeof livePreviewData === 'object') {
        // Process LivePreview author data to match expected CMSAuthor structure
        const processedAuthors =
          livePreviewData.authors?.map((author: Record<string, unknown>) => {
            // Handle both direct author objects and author references
            if (typeof author === 'object' && author !== null) {
              const authorName =
                (author.author as string) || (author.name as string) || 'Unknown Author'
              const authorId = (author.author_id as string) || (author.id as string) || ''
              const position = (author.position as string) || ''
              const authorUrl = (author.author_url as string) || '#'
              const username = (author.username as string) || ''

              // Handle author image URL with proper type checking
              let authorImageUrl: string | null = null
              const authorImage = author.author_image_url as
                | { url?: string }
                | string
                | null
                | undefined

              if (authorImage) {
                if (typeof authorImage === 'string') {
                  authorImageUrl = authorImage
                } else if (typeof authorImage === 'object' && authorImage.url) {
                  const imageUrl = authorImage.url
                  if (typeof imageUrl === 'string') {
                    authorImageUrl = imageUrl.includes('http')
                      ? imageUrl
                      : `${CMS_SITE_ORIGIN}${imageUrl}`
                  }
                }
              }

              return {
                author: authorName,
                author_id: authorId,
                position,
                author_url: authorUrl,
                author_image_url: authorImageUrl,
                username,
              }
            }
            return {
              author: typeof author === 'string' ? author : 'Unknown Author',
              author_id: '',
              position: '',
              author_url: '#',
              author_image_url: null,
              username: '',
            }
          }) ?? []

        const processedLivePreviewData = {
          ...props.blog,
          ...livePreviewData,
          authors: processedAuthors,
          // Use processed TOC if available, otherwise fall back to original
          toc: processedToc || props.blog.toc,
          toc_depth: (livePreviewData as any).toc_depth || props.blog.toc_depth || 3,
        }
        return processedLivePreviewData
      }
      if (previewData !== props.blog) {
        return previewData
      }
    }
    return props.blog
  }, [
    isDraftMode,
    shouldUseLivePreview,
    livePreviewData,
    previewData,
    props.blog,
    processedToc,
  ]) as ProcessedBlogData

  const isCMS = 'isCMS' in blogMetaData && blogMetaData.isCMS

  const blogAuthors = isCMS
    ? ('authors' in blogMetaData ? (blogMetaData.authors as CMSAuthor[]) : []) || []
    : ('author' in blogMetaData ? (blogMetaData.author as string) : '')
        ?.split(',')
        .map((authorId: string) => {
          const foundAuthor = authors.find((author) => author.author_id === authorId)
          return foundAuthor ?? null
        })
        .filter(isNotNullOrUndefined) || []

  return (
    <BlogPostRenderer
      blog={props.blog as ProcessedBlogData}
      blogMetaData={blogMetaData as ProcessedBlogData}
      isDraftMode={isDraftMode}
      isLivePreviewLoading={isLivePreviewLoading}
      prevPost={props.prevPost}
      nextPost={props.nextPost}
      authors={blogAuthors}
    />
  )
}
