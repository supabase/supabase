import dayjs from 'dayjs'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { PostReturnType, ProcessedBlogData, StaticAuthor, Tag } from 'types/post'
import { Badge } from 'ui'

import DraftModeBanner from '@/components/Blog/DraftModeBanner'
import ShareArticleActions from '@/components/Blog/ShareArticleActions'
import CTABanner from '@/components/CTABanner'
import BlogLinks from '@/components/LaunchWeek/7/BlogLinks'
import LW11Summary from '@/components/LaunchWeek/11/LW11Summary'
import LW12Summary from '@/components/LaunchWeek/12/LWSummary'
import LW13Summary from '@/components/LaunchWeek/13/Releases/LWSummary'
import LW14Summary from '@/components/LaunchWeek/14/Releases/LWSummary'
import LW15Summary from '@/components/LaunchWeek/15/LWSummary'
import LWXSummary from '@/components/LaunchWeek/X/LWXSummary'
import DefaultLayout from '@/components/Layouts/Default'
import { BLOG_POST_HERO_IMAGE_SIZES, getBlogThumbnailImage } from '@/lib/blog-images'
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
                    <p>·</p>
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
                        imageUrl && (
                          <div className="hidden md:block relative mb-8 w-full aspect-[1.91/1] overflow-auto rounded-lg border">
                            <Image
                              src={imageUrl}
                              alt={blogMetaData.title}
                              fill
                              sizes={BLOG_POST_HERO_IMAGE_SIZES}
                              className="object-cover m-0"
                            />
                          </div>
                        )
                      )}
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
                {/* Sidebar */}
                <div className="relative col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
                  <div className="space-y-6">
                    <div className="hidden lg:block">
                      <div className="flex flex-wrap gap-2">
                        {(blogMetaData.tags as Array<Tag>)?.map((tag) => {
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
