import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import type { PostReturnType, ProcessedBlogData, StaticAuthor, Tag } from 'types/post'
import { Badge, cn } from 'ui'

import { CTASection } from '../CTASection'
import SectionContainerWithCn from '../Layouts/SectionContainerWithCn'
import { BlogTableOfContents } from '@/components/Blog/BlogTableOfContents'
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

  type TocJsonItem = { content: string; slug: string; lvl: number }

  const rawToc = blogMetaData.toc as unknown as { json?: TocJsonItem[] } | string | undefined
  const tocItems =
    rawToc && typeof rawToc !== 'string' && Array.isArray(rawToc.json)
      ? rawToc.json.map((h) => ({ title: h.content, url: `#${h.slug}`, depth: h.lvl }))
      : []
  const toc = tocItems.length > 0 ? <BlogTableOfContents items={tocItems} /> : null

  const imageUrl = getBlogThumbnailImage(blogMetaData, {
    fallbackToPlaceholder: false,
  })

  const MARGIN_BOTTOM_CN = 'mb-12'

  return (
    <>
      {isDraftMode && <DraftModeBanner />}
      <div className="overflow-x-clip">
        <SectionContainerWithCn height="none">
          {/*
           * Outer grid: back button | main container
           *
           * base/md : [back:1–12] stacked above [main:1–12]
           * lg      : [back:1–12] stacked above [main:2–12]
           * xl      : [back:1–2]  alongside      [main:3–12]
           */}
          <div className="flex justify-center lg:grid grid-cols-12 gap-x-8">
            {/* Main container — indented 1 col at lg, alongside back button at xl */}
            <div className="max-w-[65ch] lg:max-w-none col-span-12 lg:col-start-2 lg:col-span-10 xl:col-start-2 xl:col-span-11">
              {/* Article header — spans the full main container width */}
              <div className="py-8 md:py-12 space-y-4">
                <div className="flex items-center gap-1.5 text-foreground-lighter text-sm">
                  <Link
                    href="/blog"
                    className="hover:text-foreground inline-flex items-center transition"
                  >
                    Blog
                  </Link>
                  {blogMetaData.categories && (
                    <>
                      <span className="text-foreground-muted"> / </span>
                      <Link
                        href={`/blog/categories/${blogMetaData.categories[0]}`}
                        className="capitalize hover:text-foreground"
                      >
                        {blogMetaData.categories[0]}
                      </Link>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl max-w-3xl text-pretty">
                  {blogMetaData.title}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="text-foreground-lighter flex space-x-3 text-sm">
                    <p>{dayjs(blogMetaData.date).format('D MMM YYYY')}</p>
                    <p>·</p>
                    <p>{(blogMetaData as any).readingTime}</p>
                  </div>
                </div>
                {authors.length > 0 && (
                  <div className="flex flex-row flex-wrap items-center gap-y-4 gap-x-6 md:gap-x-8 mt-6">
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
                                className="w-5 h-5 md:w-8 md:h-8 border-default rounded-full border aspect-square object-cover"
                                alt={`${author.author} avatar`}
                                width={32}
                                height={32}
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="text-foreground text-sm">{author.author}</span>
                              <span className="text-foreground-lighter text-xs hidden md:inline-block">
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

              {/*
               * Inner grid: article body | sidebar
               *
               * base/md : single column, sidebar hidden
               * lg+     : [body:7fr] [sidebar:3fr]
               */}
              <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
                {/* Article body */}
                <div className={cn('col-span-8', MARGIN_BOTTOM_CN)}>
                  {!blogMetaData.youtubeHero && blogMetaData.imgThumb && imageUrl && (
                    <div className="hidden lg:block relative w-full aspect-[1.91/1] overflow-hidden rounded-lg border border-foreground/10 mb-6">
                      <Image
                        src={imageUrl}
                        alt={blogMetaData.title}
                        fill
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 58vw"
                        className="object-cover"
                      />
                    </div>
                  )}

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
                    <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                  </div>

                  <div className="grid gap-8 mt-8 lg:grid-cols-1">
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

                {/* Sidebar — only above lg */}
                <div
                  className={cn(
                    'hidden lg:block col-span-4 col-start-9 space-y-8 lg:pl-6',
                    MARGIN_BOTTOM_CN
                  )}
                >
                  {(blogMetaData.tags as Tag[])?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
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
                  <div className="sticky top-24 flex flex-col gap-6 max-h-[calc(100vh-7rem)]">
                    <p className="text-foreground font-mono uppercase tracking-wide text-xs -mb-2">
                      On this page
                    </p>
                    <div className="overflow-y-auto min-h-0 flex-1">{toc}</div>
                    <div className="shrink-0">
                      <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionContainerWithCn>

        <div className="border-t">
          <CTASection />
        </div>
      </div>
    </>
  )
}

export default BlogPostRenderer
