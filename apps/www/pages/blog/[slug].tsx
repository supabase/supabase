import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import { useState, useMemo } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'

import authors from 'lib/authors.json'
import { getAllPostSlugs, getPostdata, getSortedPosts } from 'lib/posts'
import { getAllCMSPostSlugs, getCMSPostBySlug } from 'lib/get-cms-posts'
import { CMS_SITE_ORIGIN } from 'lib/constants'
import { isNotNullOrUndefined } from 'lib/helpers'

import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import type { Blog, BlogData, CMSAuthor, PostReturnType, ProcessedBlogData, Tag } from 'types/post'

const BlogPostRenderer = dynamic(() => import('components/Blog/BlogPostRenderer'))

type MatterReturn = {
  data: BlogData
  content: string
}

type BlogPostPageProps = {
  prevPost: PostReturnType | null
  nextPost: PostReturnType | null
  relatedPosts: (PostReturnType & BlogData)[]
  blog: Blog & BlogData
  isDraftMode: boolean
}

type Params = {
  slug: string
}

export async function getStaticPaths() {
  const staticPaths = getAllPostSlugs('_blog')
  const cmsPaths = await getAllCMSPostSlugs()
  const paths = [...staticPaths, ...cmsPaths]

  return {
    paths,
    fallback: 'blocking', // Set to 'blocking' to allow ISR for new CMS posts
  }
}

function BlogPostPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const isDraftMode = props.isDraftMode
  const [previewData] = useState<ProcessedBlogData>(props.blog)
  const shouldUseLivePreview = isDraftMode && props.blog.isCMS

  const { data: livePreviewData, isLoading: isLivePreviewLoading } = useLivePreview({
    initialData: props.blog,
    serverURL: CMS_SITE_ORIGIN || 'http://localhost:3030',
    depth: 2,
  })

  // Only use the live preview data for metadata
  const blogMetaData = useMemo(() => {
    if (isDraftMode && shouldUseLivePreview) {
      // Priority 1: Use data from LivePreview hook
      if (livePreviewData && typeof livePreviewData === 'object') {
        return { ...props.blog, ...livePreviewData }
      }

      // Priority 2: Use data from postMessage updates
      if (previewData !== props.blog) {
        return previewData
      }
    }

    // Fallback to blog
    return props.blog
  }, [isDraftMode, shouldUseLivePreview, livePreviewData, previewData, props.blog])

  const isCMS = blogMetaData.isCMS
  const imageUrl = isCMS
    ? blogMetaData.thumb ?? ''
    : blogMetaData.thumb
      ? `/images/blog/${blogMetaData.thumb}`
      : ''

  const meta = {
    title: blogMetaData.meta_title ?? blogMetaData.title,
    description: blogMetaData.meta_description ?? blogMetaData.description,
    url: `https://supabase.com/blog/${blogMetaData.slug}`,
  }

  const processTag = (tag: Tag): string => {
    return typeof tag === 'string' ? tag : tag.name
  }

  const tags = blogMetaData.tags
    ? Array.isArray(blogMetaData.tags)
      ? (blogMetaData.tags as Tag[]).map(processTag)
      : []
    : []

  const blogAuthors = isCMS
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

  const authorUrls = blogAuthors.map((author) => author?.author_url).filter(isNotNullOrUndefined)

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
            publishedTime: blogMetaData.date,
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
      <BlogPostRenderer
        blog={props.blog}
        blogMetaData={blogMetaData}
        isDraftMode={isDraftMode}
        isLivePreviewLoading={isLivePreviewLoading}
        prevPost={props.prevPost}
        nextPost={props.nextPost}
        authors={blogAuthors}
      />
    </>
  )
}

export const getStaticProps: GetStaticProps<BlogPostPageProps, Params> = async ({
  params,
  draftMode = false,
}) => {
  if (!params?.slug) {
    console.error('[getStaticProps] Missing slug parameter:', params)
    throw new Error('Missing slug for pages/blog/[slug].tsx')
  }

  const slug = `${params.slug}`

  // Server-only imports to keep client bundle lean
  const matter = (await import('gray-matter')).default
  const { mdxSerialize } = await import('lib/mdx/mdxSerialize')
  const markdownToc = require('markdown-toc')

  // Try static post first
  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const content = parsedContent.content
    const mdxSource = await mdxSerialize(content)
    const blogPost = { ...parsedContent.data }

    // Get all posts for navigation and related posts
    const allStaticPosts = getSortedPosts({ directory: '_blog' })
    const allPosts = [...allStaticPosts].sort((a, b) => {
      const aDate = new Date((a as unknown as { date: string }).date).getTime()
      const bDate = new Date((b as unknown as { date: string }).date).getTime()
      return bDate - aDate
    })
    const currentIndex = allPosts.findIndex((post) => post.slug === slug)
    const nextPost = currentIndex === allPosts.length - 1 ? null : allPosts[currentIndex + 1]
    const prevPost = currentIndex === 0 ? null : allPosts[currentIndex - 1]
    const tocResult = markdownToc(content, {
      maxdepth: blogPost.toc_depth ? blogPost.toc_depth : 2,
    })
    const processedContent = tocResult.content.replace(/%23/g, '')
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: (mdxSource as { scope: { tags?: string[] } }).scope.tags,
      currentPostSlug: slug,
    }) as unknown as (BlogData & PostReturnType)[]

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
      // ...(draftMode ? {} : { revalidate: 60 * 10 }),
    }
  } catch {
    console.log('[getStaticProps] Static post not found, trying CMS post...')
  }

  // Try CMS post (handle draft mode logic)
  const cmsPost = await getCMSPostBySlug(slug, draftMode)

  if (!cmsPost) {
    console.log(
      '[getStaticProps] No CMS post found, checking published version (if in draft mode)...'
    )
    // Try to fetch published version if draft mode failed
    if (draftMode) {
      const publishedPost = await getCMSPostBySlug(slug, false)

      if (!publishedPost) {
        console.log('[getStaticProps] No published version found either, returning 404')
        return { notFound: true }
      }

      const mdxSource = await mdxSerialize(publishedPost.content || '')

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
        // ...(draftMode ? {} : { revalidate: 60 * 10 }),
      }
    }

    return { notFound: true }
  }

  // For CMS posts, process content
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
    // ...(draftMode ? {} : { revalidate: 60 * 10 }),
  }
}

export default BlogPostPage
