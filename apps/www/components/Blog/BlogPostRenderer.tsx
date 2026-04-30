'use client'

import dayjs from 'dayjs'
import { ChevronLeft } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import type { PostReturnType, ProcessedBlogData, StaticAuthor, Tag } from 'types/post'
import { Badge } from 'ui'

import { BLOG_POST_HERO_IMAGE_SIZES, getBlogThumbnailImage } from '@/lib/blog-images'
import mdxComponents from '@/lib/mdx/mdxComponents'

const ShareArticleActions = dynamic(() => import('@/components/Blog/ShareArticleActions'))
const CTABanner = dynamic(() => import('@/components/CTABanner'))
const LW11Summary = dynamic(() => import('@/components/LaunchWeek/11/LW11Summary'))
const LW12Summary = dynamic(() => import('@/components/LaunchWeek/12/LWSummary'))
const LW13Summary = dynamic(() => import('@/components/LaunchWeek/13/Releases/LWSummary'))
const LW14Summary = dynamic(() => import('@/components/LaunchWeek/14/Releases/LWSummary'))
const LW15Summary = dynamic(() => import('@/components/LaunchWeek/15/LWSummary'))
const BlogLinks = dynamic(() => import('@/components/LaunchWeek/7/BlogLinks'))
const LWXSummary = dynamic(() => import('@/components/LaunchWeek/X/LWXSummary'))
const DefaultLayout = dynamic(() => import('@/components/Layouts/Default'))
const DraftModeBanner = dynamic(() => import('@/components/Blog/DraftModeBanner'))
const ReactMarkdown = dynamic<{ children: string }>(
  () =>
    import('react-markdown').then(
      (m) => m.default as unknown as ComponentType<{ children: string }>
    ),
  { ssr: false }
)

const BlogPostRenderer = ({
  blog,
  blogMetaData,
  isDraftMode,
  prevPost,
  nextPost,
  authors,
}: {
  blog: ProcessedBlogData
  blogMetaData: ProcessedBlogData
  isDraftMode: boolean
  prevPost?: PostReturnType | null
  nextPost?: PostReturnType | null
  authors: StaticAuthor[]
}) => {
  const [previewData] = useState<ProcessedBlogData>(blog)

  // For LivePreview, we'll use the raw content directly with ReactMarkdown
  // instead of trying to use MDXRemote which requires specific serialization
  const isLivePreview = isDraftMode && previewData !== blog

  // Extract raw content from data if available
  const livePreviewContent = useMemo(() => {
    // Priority 2: Use data from postMessage updates
    if (isDraftMode && previewData !== blog) {
      // If content is a string, use it directly
      if (typeof (previewData as unknown as { content?: unknown }).content === 'string') {
        return (previewData as unknown as { content?: string }).content as string
      }

      // If content is from source property
      if (
        (previewData as unknown as { source?: unknown }).source &&
        typeof (previewData as unknown as { source?: unknown }).source === 'string'
      ) {
        return (previewData as unknown as { source?: string }).source as string
      }
    }

    return blog.source || ''
  }, [isDraftMode, previewData, blog])

  const isLaunchWeek7 = blogMetaData.launchweek === '7'
  const isLaunchWeekX = blogMetaData.launchweek?.toString().toLocaleLowerCase() === 'x'
  const isGAWeek = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '11'
  const isLaunchWeek12 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '12'
  const isLaunchWeek13 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '13'
  const isLaunchWeek14 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '14'
  const isLaunchWeek15 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '15'

  type NextCardProps = {
    post: { path: string; title: string; formattedDate: string }
    label: string
    className?: string
  }
  const NextCard = (props: NextCardProps) => {
    const { post, label, className } = props

    return (
      <Link href={`${post.path}`} as={`${post.path}`}>
        <div className={className ?? ''}>
          <div className="hover:bg-control cursor-pointer rounded-sm border p-6 transition">
            <div className="space-y-4">
              <div>
                <p className="text-foreground-lighter text-sm">{label}</p>
              </div>
              <div className="flex flex-col gap-2">
                {'title' in post && (
                  <h4 className="text-foreground text-lg text-balance">
                    {(post as { title?: string }).title}
                  </h4>
                )}
                {'formattedDate' in post && (
                  <p className="small">{(post as { formattedDate?: string }).formattedDate}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const toc = blogMetaData.toc && (
    <div>
      <p className="text-foreground mb-4">On this page</p>
      <div className="prose-toc">
        {blogMetaData.toc && (
          <ReactMarkdown>
            {typeof blogMetaData.toc === 'string'
              ? (blogMetaData.toc as string)
              : (blogMetaData.toc as { content: string }).content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )

  const imageUrl = getBlogThumbnailImage(blogMetaData, {
    fallbackToPlaceholder: false,
  })

  return (
    <>
      {isDraftMode && <DraftModeBanner />}
      <DefaultLayout className="overflow-x-hidden">
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default BlogPostRenderer
