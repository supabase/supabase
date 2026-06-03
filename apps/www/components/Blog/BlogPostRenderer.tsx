import dayjs from 'dayjs'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { PostReturnType, ProcessedBlogData, StaticAuthor, Tag } from 'types/post'
import { Badge } from 'ui'

import { CTASection } from '@/app/(home)/_components/CTASection'
import DraftModeBanner from '@/components/Blog/DraftModeBanner'
import ShareArticleActions from '@/components/Blog/ShareArticleActions'
import BlogLinks from '@/components/LaunchWeek/7/BlogLinks'
import LW11Summary from '@/components/LaunchWeek/11/LW11Summary'
import LW12Summary from '@/components/LaunchWeek/12/LWSummary'
import LW13Summary from '@/components/LaunchWeek/13/Releases/LWSummary'
import LW14Summary from '@/components/LaunchWeek/14/Releases/LWSummary'
import LW15Summary from '@/components/LaunchWeek/15/LWSummary'
import LWXSummary from '@/components/LaunchWeek/X/LWXSummary'
import { getBlogThumbnailImage } from '@/lib/blog-images'
import { compileBlogMdx } from '@/lib/mdx/compileBlogMdx'
import mdxComponents from '@/lib/mdx/mdxComponents'

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

const BlogPostRenderer = async ({
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
  authors: Array<StaticAuthor>
}) => {
  const mdxRendered = await compileBlogMdx(blog.content as string, mdxComponents('blog'))

  const isLaunchWeek7 = blogMetaData.launchweek === '7'
  const isLaunchWeekX = blogMetaData.launchweek?.toString().toLocaleLowerCase() === 'x'
  const isGAWeek = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '11'
  const isLaunchWeek12 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '12'
  const isLaunchWeek13 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '13'
  const isLaunchWeek14 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '14'
  const isLaunchWeek15 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '15'

  const toc = blogMetaData.toc && (
    <div>
      <p className="text-foreground-lighter text-sm font-normal mb-3">On this page</p>
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
      <div className="overflow-x-clip">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
          <div className="grid grid-cols-12 xl:gap-x-8 xl:gap-y-0">
            {/* Row 1, Col 1: Back button */}
            <div className="col-span-12 xl:row-start-1 xl:col-start-1 xl:col-span-1 pt-16 xl:pt-32 flex items-start justify-start">
              <Link
                href="/blog"
                className="text-foreground-lighter hover:text-foreground inline-flex cursor-pointer items-center text-sm transition"
              >
                <ArrowLeft strokeWidth={1.5} className="size-4" />
                Blog
              </Link>
            </div>

            {/* Row 1, Col 2: Title + meta */}
            <div className="col-span-12 xl:row-start-1 xl:col-start-2 xl:col-span-7 pt-4 xl:pt-32 pb-6 space-y-4">
              <div className="space-y-4">
                {(blogMetaData.tags as Tag[])?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(blogMetaData.tags as Tag[])?.map((tag) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name
                      const tagId = typeof tag === 'string' ? tag : tag.id.toString()
                      return (
                        <Link
                          className="flex"
                          href={`/blog/tags/${tagName}`}
                          key={`category-badge-${tagId}`}
                        >
                          <Badge>{tagName}</Badge>
                        </Link>
                      )
                    })}
                  </div>
                )}
                <h1 className="text-2xl sm:text-4xl max-w-3xl">{blogMetaData.title}</h1>
                <div className="flex items-center gap-2">
                  <div className="text-foreground-lighter flex space-x-3 text-sm">
                    <p>{dayjs(blogMetaData.date).format('DD MMM YYYY')}</p>
                    <p>·</p>
                    <p>{(blogMetaData as any).readingTime}</p>
                  </div>
                </div>
                {authors.length > 0 && (
                  <div className="flex items-center gap-4 mt-6">
                    {authors.map((author, i: number) => {
                      const authorImageUrl = author.author_image_url
                      const authorId =
                        (author as any).author_id ||
                        (author as any).username ||
                        author.author.toLowerCase().replace(/\s+/g, '_')
                      return (
                        <Link
                          href={`/blog/authors/${authorId}`}
                          className="cursor-pointer"
                          key={`author-${i}-${author.author}`}
                        >
                          <div className="flex items-center gap-2">
                            {authorImageUrl && (
                              <Image
                                src={authorImageUrl}
                                className="border-default rounded-full border aspect-square object-cover"
                                alt={`${author.author} avatar`}
                                width={32}
                                height={32}
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="text-foreground text-sm">{author.author}</span>
                              <span className="text-foreground-lighter text-xs">
                                {author.position}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Hero image — col-start-1 col-span-9 = equal overhang each side of content (col 2–8) */}
            {!blogMetaData.youtubeHero && blogMetaData.imgThumb && (
              <div className="col-span-12 xl:row-start-2 xl:col-start-1 xl:col-span-9 mb-6">
                <div className="relative w-full aspect-[1.91/1] overflow-hidden rounded-lg border border-foreground/10">
                  <Image
                    src={imageUrl}
                    alt={blogMetaData.title}
                    fill
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 75vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Row 3: Article */}
            <div className="col-span-12 xl:row-start-3 xl:col-start-2 xl:col-span-7 pb-16">
              <article>
                <div className="prose prose-docs">
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
                  ) : null}
                  {mdxRendered}
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

            {/* TOC: starts at row 2 alongside image, sticky through article */}
            <div className="hidden xl:block xl:row-start-2 xl:row-span-2 xl:col-start-10 xl:col-span-3 xl:pl-6">
              <div className="sticky top-24 flex flex-col gap-6 max-h-[calc(100vh-7rem)]">
                <div className="overflow-y-auto min-h-0 flex-1">{toc}</div>
                <div className="shrink-0">
                  <div className="text-foreground text-sm mb-2">Share this article</div>
                  <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t">
          <CTASection />
        </div>
      </div>
    </>
  )
}

export default BlogPostRenderer
