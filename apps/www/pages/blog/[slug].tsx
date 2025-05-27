import matter from 'gray-matter'
import { useState, useMemo } from 'react'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import dayjs from 'dayjs'
import { ChevronLeft } from 'lucide-react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { Badge } from 'ui'

import authors from 'lib/authors.json'
import { isNotNullOrUndefined } from '~/lib/helpers'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import { getAllCMSPostSlugs, getCMSPostBySlug, getAllCMSPosts } from '~/lib/cms-posts'

import ShareArticleActions from '~/components/Blog/ShareArticleActions'
import CTABanner from '~/components/CTABanner'
import LW11Summary from '~/components/LaunchWeek/11/LW11Summary'
import LW12Summary from '~/components/LaunchWeek/12/LWSummary'
import LW13Summary from '~/components/LaunchWeek/13/Releases/LWSummary'
import LW14Summary from '~/components/LaunchWeek/14/Releases/LWSummary'
import BlogLinks from '~/components/LaunchWeek/7/BlogLinks'
import LWXSummary from '~/components/LaunchWeek/X/LWXSummary'
import DefaultLayout from '~/components/Layouts/Default'
import { LivePreview } from '~/components/Blog/LivePreview'
import { DraftModeBanner } from '~/components/Blog/DraftModeBanner'

type Post = ReturnType<typeof getSortedPosts>[number]

type CMSAuthor = {
  author: string
  author_image_url: {
    url: string
  }
  author_url: string
  position: string
}

type StaticAuthor = {
  author: string
  author_image_url: string | null
  author_url: string
  position: string
}

type BlogData = {
  slug: string
  title: string
  description?: string
  content: any
  toc: any
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  date: string
  categories?: string[]
  tags?:
    | string[]
    | Array<{
        id: number
        documentId: string
        name: string
        createdAt: string
        updatedAt: string
        publishedAt: string
      }>
  toc_depth?: number
  video?: string
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  isCMS?: boolean
}

type MatterReturn = {
  data: BlogData
  content: string
}

type Blog = {
  slug: string
  title: string
  description?: string
  content: any
  toc: any
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  date: string
  categories?: string[]
  tags?:
    | string[]
    | Array<{
        id: number
        documentId: string
        name: string
        createdAt: string
        updatedAt: string
        publishedAt: string
      }>
  toc_depth?: number
  video?: string
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  isCMS?: boolean
}

type BlogPostPageProps = {
  prevPost: Post | null
  nextPost: Post | null
  relatedPosts: (Post & BlogData)[]
  blog: Blog & BlogData
  isDraftMode: boolean
}

type Params = {
  slug: string
}

// table of contents extractor
const toc = require('markdown-toc')

type Tag =
  | string
  | {
      name: string
      id: number
      documentId: string
      createdAt: string
      updatedAt: string
      publishedAt: string
    }
type Category = string | { name: string }

// Add a new type for processed blog data
type ProcessedBlogData = BlogData &
  Blog & {
    needsSerialization?: boolean
  }

export async function getStaticPaths() {
  // Get paths from static files
  const staticPaths = getAllPostSlugs('_blog')

  // Get paths from CMS
  const cmsPaths = await getAllCMSPostSlugs()

  // Combine both path sources
  const paths = [...staticPaths, ...cmsPaths]

  return {
    paths,
    fallback: 'blocking', // Set to 'blocking' to allow ISR for new CMS posts
  }
}

export const getStaticProps: GetStaticProps<BlogPostPageProps, Params> = async ({
  params,
  draftMode = false,
}) => {
  console.log('[getStaticProps] Called with params:', params, 'draftMode:', draftMode)

  if (!params?.slug) {
    console.error('[getStaticProps] Missing slug parameter:', params)
    throw new Error('Missing slug for pages/blog/[slug].tsx')
  }

  const slug = `${params.slug}`
  console.log(
    `[getStaticProps] generating for slug: '${slug}', draft mode: ${draftMode ? 'true' : 'false'}`
  )

  // Try static post first
  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const content = parsedContent.content
    const mdxSource = await mdxSerialize(content)
    const blogPost = { ...parsedContent.data }

    // Get all posts for navigation and related posts
    const allStaticPosts = getSortedPosts({ directory: '_blog' })
    const allCmsPosts = await getAllCMSPosts()
    const allPosts = [...allStaticPosts, ...allCmsPosts].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const currentIndex = allPosts.findIndex((post) => post.slug === slug)
    const nextPost = currentIndex === allPosts.length - 1 ? null : allPosts[currentIndex + 1]
    const prevPost = currentIndex === 0 ? null : allPosts[currentIndex - 1]
    const tocResult = toc(content, { maxdepth: blogPost.toc_depth ? blogPost.toc_depth : 2 })
    const processedContent = tocResult.content.replace(/%23/g, '')
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: mdxSource.scope.tags,
      currentPostSlug: slug,
    }) as unknown as (BlogData & Post)[]

    return {
      props: {
        prevPost,
        nextPost,
        relatedPosts,
        blog: {
          ...blogPost,
          content: mdxSource,
          toc: {
            ...tocResult,
            content: processedContent,
          },
        },
        isDraftMode: draftMode,
      },
      // Don't use revalidate in draft mode
      ...(draftMode ? {} : { revalidate: 60 * 10 }),
    }
  } catch (error) {
    console.log('[getStaticProps] Static post not found, trying CMS post...')
    // Not a static post, try CMS
  }

  // Try CMS post (handle draft mode logic)
  const cmsPost = await getCMSPostBySlug(slug, draftMode)

  if (!cmsPost) {
    console.log(
      '[getStaticProps] No CMS post found, checking published version (if in draft mode)...'
    )
    // Try to fetch published version if draft mode failed
    if (draftMode) {
      console.log('[getStaticProps] In draft mode but no draft found, trying published version...')
      const publishedPost = await getCMSPostBySlug(slug, false)
      console.log('[getStaticProps] Published post:', publishedPost)
      if (!publishedPost) {
        console.log('[getStaticProps] No published version found either, returning 404')
        return { notFound: true }
      }
      console.log('[getStaticProps] Found published version, using that for draft mode')
      const mdxSource = await mdxSerialize(publishedPost.content || '')
      console.log('[getStaticProps] MDX source:', mdxSource)
      return {
        props: {
          prevPost: null,
          nextPost: null,
          relatedPosts: [],
          blog: {
            ...publishedPost,
            tags: publishedPost.tags || [],
            authors: publishedPost.authors || [],
            isCMS: true,
            content: mdxSource,
            toc: publishedPost.toc,
            image: publishedPost.image ?? undefined,
            thumb: publishedPost.thumb ?? undefined,
          },
          isDraftMode: draftMode,
        },
        // Don't use revalidate in draft mode
        ...(draftMode ? {} : { revalidate: 60 * 10 }),
      }
    }
    console.log('[getStaticProps] Not in draft mode and no CMS post found, returning 404')
    return { notFound: true }
  }

  // For CMS posts, process content
  console.log('[getStaticProps] Processing CMS post data for render')
  const mdxSource = await mdxSerialize(cmsPost.content || '')

  return {
    props: {
      prevPost: null,
      nextPost: null,
      relatedPosts: [],
      blog: {
        ...cmsPost,
        tags: cmsPost.tags || [],
        authors: cmsPost.authors || [],
        isCMS: true,
        content: mdxSource,
        toc: cmsPost.toc,
        image: cmsPost.image ?? undefined,
        thumb: cmsPost.thumb ?? undefined,
      },
      isDraftMode: draftMode,
    },
    // Don't use revalidate in draft mode
    ...(draftMode ? {} : { revalidate: 60 * 10 }),
  }
}

function BlogPostPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  // Use the draft mode state passed from getStaticProps
  const isDraftMode = props.isDraftMode

  console.log('isDraftMode', isDraftMode)
  const [previewData, setPreviewData] = useState<ProcessedBlogData>(props.blog)

  const { data: livePreviewData, isLoading: isLivePreviewLoading } = useLivePreview({
    initialData: props.blog,
    serverURL: process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030',
    depth: 2,
  })

  console.log('[BlogPostPage] LivePreview data from hook:', livePreviewData)
  console.log('[BlogPostPage] Initial data:', props.blog)
  console.log(
    '[BlogPostPage] Server URL for live preview:',
    process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030'
  )

  // For LivePreview, we'll use the raw content directly with ReactMarkdown
  // instead of trying to use MDXRemote which requires specific serialization
  const isLivePreview = isDraftMode && (livePreviewData !== undefined || previewData !== props.blog)

  // Extract raw content from data if available
  const livePreviewContent = useMemo(() => {
    // Priority 1: Use data from LivePreview hook
    if (livePreviewData) {
      console.log('[BlogPostPage] Using livePreviewData for content')

      // If content is a string, use it directly
      if (typeof livePreviewData.content === 'string') {
        return livePreviewData.content
      }

      // If content is from source property
      if (livePreviewData.source && typeof livePreviewData.source === 'string') {
        return livePreviewData.source
      }
    }

    // Priority 2: Use data from postMessage updates
    if (previewData !== props.blog) {
      console.log('[BlogPostPage] Using previewData from postMessage for content')

      // If content is a string, use it directly
      if (typeof previewData.content === 'string') {
        return previewData.content
      }

      // If content is from source property
      if (previewData.source && typeof previewData.source === 'string') {
        return previewData.source
      }
    }

    // Fallback to props.blog.source
    return props.blog.source || ''
  }, [livePreviewData, previewData, props.blog])

  // Only use the live preview data for metadata
  const blogMetaData = useMemo(() => {
    if (isDraftMode) {
      // Priority 1: Use data from LivePreview hook
      if (livePreviewData) {
        return livePreviewData
      }

      // Priority 2: Use data from postMessage updates
      if (previewData !== props.blog) {
        return previewData
      }
    }

    // Fallback to props.blog
    return props.blog
  }, [isDraftMode, livePreviewData, previewData, props.blog])

  const handlePreviewUpdate = (data: any) => {
    console.log('[BlogPostPage] Received preview update:', data)
    setPreviewData((prev) => {
      const updatedData = {
        ...prev,
        ...data,
      }
      console.log('[BlogPostPage] Updated previewData:', updatedData)
      return updatedData
    })

    // Force a router refresh to get the latest data
    if (isDraftMode) {
      console.log('[BlogPostPage] Refreshing router to get latest draft data')
      router.replace(router.asPath, undefined, {
        shallow: false,
        scroll: false,
      })
    }
  }

  const content = blogMetaData.content
  const isCMS = blogMetaData.isCMS
  const isLaunchWeek7 = blogMetaData.launchweek === '7'
  const isLaunchWeekX = blogMetaData.launchweek?.toString().toLocaleLowerCase() === 'x'
  const isGAWeek = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '11'
  const isLaunchWeek12 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '12'
  const isLaunchWeek13 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '13'
  const isLaunchWeek14 = blogMetaData.launchweek?.toString().toLocaleLowerCase() === '14'

  // For CMS posts, the author info is already included
  // For static posts, we need to look up the author in authors.json
  const author = isCMS
    ? (blogMetaData.authors as CMSAuthor[]) || []
    : (blogMetaData.author as string)
        ?.split(',')
        .map((authorId: string) => {
          const foundAuthor = authors.find((author) => author.author_id === authorId)
          return foundAuthor
            ? {
                author: foundAuthor.author || 'Author',
                author_image_url: foundAuthor.author_image_url || null,
                author_url: foundAuthor.author_url || '#',
                position: foundAuthor.position || '',
              }
            : null
        })
        .filter(isNotNullOrUndefined) || []

  const authorUrls = author.map((author) => author?.author_url).filter(isNotNullOrUndefined)

  const { basePath } = useRouter()

  const NextCard = (props: any) => {
    const { post, label, className } = props

    return (
      <Link href={`${post.path}`} as={`${post.path}`}>
        <div className={className}>
          <div className="hover:bg-control cursor-pointer rounded border p-6 transition">
            <div className="space-y-4">
              <div>
                <p className="text-foreground-lighter text-sm">{label}</p>
              </div>
              <div>
                <h4 className="text-foreground text-lg">{post.title}</h4>
                <p className="small">{post.formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const toc = blogMetaData.toc && (
    <div className="space-y-8 py-8 lg:py-0">
      <div>
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
      <div>
        <div>
          <p className="text-foreground mb-4">On this page</p>
          <div className="prose-toc">
            {blogMetaData.toc && (
              <ReactMarkdown>
                {typeof blogMetaData.toc === 'string' ? blogMetaData.toc : blogMetaData.toc.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const imageUrl = isCMS ? blogMetaData.thumb! : `/images/blog/${blogMetaData.thumb}`

  const meta = {
    title: blogMetaData.meta_title ?? blogMetaData.title,
    description: blogMetaData.meta_description ?? blogMetaData.description,
    url: `https://supabase.com/blog/${blogMetaData.slug}`,
  }

  const processTag = (tag: Tag): string => {
    return typeof tag === 'string' ? tag : tag.name
  }

  const processCategory = (category: Category): string => {
    return typeof category === 'string' ? category : category.name
  }

  const tags = blogMetaData.tags
    ? Array.isArray(blogMetaData.tags)
      ? (blogMetaData.tags as Tag[]).map(processTag)
      : []
    : []

  const categories = blogMetaData.categories
    ? Array.isArray(blogMetaData.categories)
      ? (blogMetaData.categories as Category[]).map(processCategory)
      : []
    : []

  const generateReadingTime = (text: string | undefined): string => {
    if (!text) return '0 min read'
    const wordsPerMinute = 200
    const numberOfWords = text.split(/\s/g).length
    const minutes = Math.ceil(numberOfWords / wordsPerMinute)
    return `${minutes} min read`
  }

  return (
    <>
      <NextSeo
        title={meta.title}
        description={meta.description}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: meta.url,
          type: 'article',
          videos: blogMetaData.video
            ? [
                {
                  // youtube based video meta
                  url: blogMetaData.video,
                  type: 'application/x-shockwave-flash',
                  width: 640,
                  height: 385,
                },
              ]
            : undefined,
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: blogMetaData.date,
            //
            // to do: author urls should be internal in future
            // currently we have external links to github profiles
            authors: authorUrls,
            tags: tags,
          },
          images: [
            {
              url: imageUrl,
              alt: `${blogMetaData.title} thumbnail`,
            },
          ],
        }}
      />
      {isLivePreviewLoading && (
        <div className="fixed top-10 right-10 border rounded-full rounded-tr-none animate-spin transform w-10 h-10 bg-transparent" />
      )}
      {isDraftMode && <DraftModeBanner />}
      {isDraftMode && <LivePreview onUpdate={handlePreviewUpdate} />}
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
                    Blog{' '}
                    {isLivePreviewLoading && (
                      <div className="text-xs text-foreground-lighter ml-4">Draft loading...</div>
                    )}
                  </Link>
                  <h1 className="text-2xl sm:text-4xl">{blogMetaData.title}</h1>
                  <div className="text-light flex space-x-3 text-sm">
                    <p>{dayjs(blogMetaData.date).format('DD MMM YYYY')}</p>
                    <p>•</p>
                    <p>{generateReadingTime(blogMetaData.source)}</p>
                  </div>
                  {author.length > 0 && (
                    <div className="hidden lg:flex justify-between">
                      <div className="flex-1 flex flex-col gap-3 pt-2 md:flex-row md:gap-0 lg:gap-3">
                        {author.map((author, i: number) => {
                          // Handle both static and CMS author image formats
                          const imageUrl =
                            typeof author.author_image_url === 'string'
                              ? author.author_image_url
                              : (author.author_image_url as { url: string })?.url || ''

                          return (
                            <div className="mr-4 w-max" key={i}>
                              <Link
                                href={author.author_url}
                                target="_blank"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  {imageUrl && (
                                    <div className="w-10">
                                      <Image
                                        src={imageUrl}
                                        className="border-default rounded-full border w-full aspect-square object-cover"
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
                          className="w-full"
                          width="700"
                          height="350"
                          src={blogMetaData.youtubeHero}
                          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen={true}
                        />
                      ) : (
                        blogMetaData.thumb && (
                          <div className="hidden md:block relative mb-8 w-full aspect-video overflow-auto rounded-lg border">
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
                        <MDXRemote {...props.blog.content} components={mdxComponents('blog')} />
                      )}
                    </div>
                  </article>
                  {isLaunchWeek7 && <BlogLinks />}
                  {isLaunchWeekX && <LWXSummary />}
                  {isGAWeek && <LW11Summary />}
                  {isLaunchWeek12 && <LW12Summary />}
                  {isLaunchWeek13 && <LW13Summary />}
                  {isLaunchWeek14 && <LW14Summary />}
                  <div className="block lg:hidden py-8">
                    <div className="text-foreground-lighter text-sm">Share this article</div>
                    <ShareArticleActions title={blogMetaData.title} slug={blogMetaData.slug} />
                  </div>
                  <div className="grid gap-8 py-8 lg:grid-cols-1">
                    <div>
                      {props.prevPost && <NextCard post={props.prevPost} label="Last post" />}
                    </div>
                    <div>
                      {props.nextPost && (
                        <NextCard post={props.nextPost} label="Next post" className="text-right" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Sidebar */}
                <div className="relative col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
                  <div className="space-y-6">
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

export default BlogPostPage
