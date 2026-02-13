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
          <div className="hover:bg-control cursor-pointer rounded border p-6 transition">
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

  const imageUrl = blogMetaData.imgThumb
    ? blogMetaData.imgThumb.startsWith('/') || blogMetaData.imgThumb.startsWith('http')
      ? blogMetaData.imgThumb
      : `/images/blog/${blogMetaData.imgThumb}`
    : ''

  return (
    <>
      {isDraftMode && <DraftModeBanner />}
      <DefaultLayout className="overflow-x-hidden">
        <div
          className="
            container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="hidden col-span-12 xl:block lg:col-span-2">
              {/* Back button */}
              <Link
                href="/blog"
                className="text-foreground-lighter hover:text-foreground flex cursor-pointer items-center text-sm transition"
              >
                <ChevronLeft style={{ padding: 0 }} />
                Back
              </Link>
            </div>
            <div className="col-span-12 lg:col-span-12 xl:col-span-10">
              {/* Title and description */}
              <div className="mb-6 lg:mb-10 max-w-5xl space-y-8">
                <div className="space-y-4">
                  <Link href="/blog" className="text-brand hidden lg:inline-flex items-center">
                    Blog
                  </Link>
                  <h1 className="text-2xl sm:text-4xl">{blogMetaData.title}</h1>
                  <div className="text-light flex space-x-3 text-sm">
                    <p>{dayjs(blogMetaData.date).format('DD MMM YYYY')}</p>
                    <p>•</p>
                    <p>{(blogMetaData as any).readingTime}</p>
                  </div>
                  {authors.length > 0 && (
                    <div className="flex justify-between">
                      <div className="flex-1 flex flex-wrap gap-3 pt-2 md:gap-0 lg:gap-3">
                        {authors.map((author, i: number) => {
                          const authorImageUrl = author.author_image_url

                          const authorId =
                            (author as any).author_id ||
                            (author as any).username ||
                            author.author.toLowerCase().replace(/\s+/g, '_')

                          return (
                            <div className="mr-4 w-max" key={`author-${i}-${author.author}`}>
                              <Link href={`/blog/authors/${authorId}`} className="cursor-pointer">
                                <div className="flex items-center gap-3">
                                  {authorImageUrl && (
                                    <div className="w-10">
                                      <Image
                                        src={authorImageUrl}
                                        className="border-default rounded-full border w-full max-h-10 aspect-square object-cover"
                                        alt={`${author.author} avatar`}
                                        width={40}
                                        height={40}
                                      />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-foreground mb-0 text-sm">
                                      {author.author}
                                    </span>
                                    <span className="text-foreground-lighter mb-0 text-xs">
                                      {author.position}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-12 lg:gap-16 xl:gap-8">
                {/* Content */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-7">
                  <article>
                    <div className={['prose prose-docs'].join(' ')}>
                      {blogMetaData.youtubeHero ? (
                        <iframe
                          title="YouTube video player"
                          className="w-full"
                          width="700"
                          height="350"
                          src={blogMetaData.youtubeHero}
                          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen={true}
                        />
                      ) : (
                        blogMetaData.imgThumb && (
                          <div className="hidden md:block relative mb-8 w-full aspect-[1.91/1] overflow-auto rounded-lg border">
                            <Image
                              src={imageUrl}
                              alt={blogMetaData.title}
                              fill
                              quality={100}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover m-0"
                            />
                          </div>
                        )
                      )}
                      {/* Use ReactMarkdown for LivePreview mode, MDXRemote for normal mode */}
                      {isLivePreview ? (
                        <ReactMarkdown>{livePreviewContent}</ReactMarkdown>
                      ) : (
                        <MDXRemote
                          {...(blog.content as MDXRemoteSerializeResult)}
                          components={mdxComponents('blog')}
                        />
                      )}
                    </div>
                  </article>
                  {isLaunchWeek7 && <BlogLinks />}
                  {isLaunchWeekX && <LWXSummary />}
                  {isGAWeek && <LW11Summary />}
                  {isLaunchWeek12 && <LW12Summary />}
                  {isLaunchWeek13 && <LW13Summary />}
                  {isLaunchWeek14 && <LW14Summary />}
                  {isLaunchWeek15 && <LW15Summary />}
                  <div className="block lg:hidden py-8">
                    <div className="text-foreground-lighter text-sm">Share this article</div>
                    <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                  </div>
                  <div className="grid gap-8 py-8 lg:grid-cols-1">
                    <div>
                      {prevPost && (
                        <NextCard
                          post={
                            prevPost as unknown as {
                              path: string
                              title: string
                              formattedDate: string
                            }
                          }
                          label="Previous post"
                        />
                      )}
                    </div>
                    <div>
                      {nextPost && (
                        <NextCard
                          post={
                            nextPost as unknown as {
                              path: string
                              title: string
                              formattedDate: string
                            }
                          }
                          label="Next post"
                          className="text-right"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {/* Sidebar */}
                <div className="relative col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
                  <div className="space-y-6">
                    <div className="hidden lg:block">
                      <div className="flex flex-wrap gap-2">
                        {(blogMetaData.tags as Tag[])?.map((tag) => {
                          const tagName = typeof tag === 'string' ? tag : tag.name
                          const tagId = typeof tag === 'string' ? tag : tag.id.toString()
                          return (
                            <Link href={`/blog/tags/${tagName}`} key={`category-badge-${tagId}`}>
                              <Badge>{tagName}</Badge>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                    <div className="hidden lg:block">{toc}</div>
                    <div className="hidden lg:block">
                      <div className="text-foreground text-sm">Share this article</div>
                      <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default BlogPostRenderer
