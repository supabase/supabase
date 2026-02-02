import { getAllCMSPostSlugs, getCMSPostBySlug } from 'lib/get-cms-posts'
import { getAllPostSlugs, getPostdata, getSortedPosts } from 'lib/posts'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import type { Blog, BlogData, PostReturnType } from 'types/post'

import BlogPostClient from './BlogPostClient'
import { processCMSContent } from '~/lib/cms/processCMSContent'
import { CMS_SITE_ORIGIN, SITE_ORIGIN } from '~/lib/constants'

export const revalidate = 30

// Helper function to fetch CMS post using our unified API
async function getCMSPostFromAPI(
  slug: string,
  mode: 'preview' | 'full' = 'full',
  isDraft: boolean = false
) {
  try {
    const url = new URL(`${SITE_ORIGIN}/api-v2/cms-posts`)
    url.searchParams.set('slug', slug)
    url.searchParams.set('mode', mode)
    if (isDraft) {
      url.searchParams.set('draft', 'true')
    }

    // Use different caching strategies based on draft mode
    const fetchOptions = isDraft
      ? {
          // For draft mode: always fresh data, no caching
          // cache: 'no-store' as const,
          next: { revalidate: 0 },
        }
      : {
          // For published posts: allow static generation with revalidation
          next: { revalidate: 60 }, // 1 minute
        }

    const response = await fetch(url.toString(), fetchOptions)

    if (!response.ok) {
      console.warn('[getCMSPostFromAPI] Non-OK response:', response.status)
      return null
    }

    const data = await response.json()

    return data.success ? data.post : null
  } catch (error) {
    console.warn('[getCMSPostFromAPI] Error:', error)
    return null
  }
}

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

export async function generateStaticParams() {
  const staticPaths = getAllPostSlugs('_blog')
  const cmsPaths = await getAllCMSPostSlugs()
  return [...staticPaths, ...cmsPaths].map((p) => ({ slug: p.params.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params

  if (!slug) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const { isEnabled: isDraft } = await draftMode()
  const matter = (await import('gray-matter')).default

  // Try to get static markdown post first
  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const blogPost = parsedContent.data
    const blogImage = blogPost.imgThumb || blogPost.imgSocial
    const metaImageUrl = blogImage
      ? blogImage.startsWith('http')
        ? blogImage
        : `${CMS_SITE_ORIGIN.replace('/api-v2', '')}${blogImage}`
      : undefined

    return {
      title: blogPost.title,
      description: blogPost.description,
      openGraph: {
        title: blogPost.title,
        description: blogPost.description,
        url: `${SITE_ORIGIN}/blog/${slug}`,
        type: 'article',
        images: metaImageUrl ? [metaImageUrl] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: blogPost.title,
        description: blogPost.description,
        images: metaImageUrl ? [metaImageUrl] : undefined,
      },
    }
  } catch {
    // Static post not found, try CMS post
  }

  // Try to fetch CMS post for metadata
  let cmsPost = await getCMSPostFromAPI(slug, 'preview', isDraft)

  if (!cmsPost) {
    cmsPost = await getCMSPostBySlug(slug, isDraft)
  }

  if (!cmsPost) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  // Extract meta fields with fallbacks
  const metaTitle = cmsPost.meta?.title || cmsPost.title
  const metaDescription = cmsPost.meta?.description || cmsPost.description

  // Handle different image field types from CMS
  let metaImageUrl: string | undefined
  if (cmsPost.meta?.image) {
    // If meta.image is an object with url property
    if (typeof cmsPost.meta.image === 'object' && cmsPost.meta.image.url) {
      metaImageUrl = cmsPost.meta.image.url
    }
    // If meta.image is a string URL
    else if (typeof cmsPost.meta.image === 'string') {
      metaImageUrl = cmsPost.meta.image
    }
  }

  // Fallback to imgThumb or imgSocial if no meta image
  if (!metaImageUrl) {
    metaImageUrl = cmsPost.imgThumb || cmsPost.imgSocial
  }

  // Ensure image URLs are absolute
  const absoluteImageUrl = metaImageUrl
    ? metaImageUrl.startsWith('http')
      ? metaImageUrl
      : `${CMS_SITE_ORIGIN.replace('/api-v2', '')}${metaImageUrl}`
    : undefined

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `${SITE_ORIGIN}/blog/${slug}`,
      type: 'article',
      publishedTime: cmsPost.date || cmsPost.publishedAt,
      authors: cmsPost.authors?.map((author: any) => author.author || 'Unknown Author'),
      images: absoluteImageUrl ? [{ url: absoluteImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: absoluteImageUrl ? [absoluteImageUrl] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  if (!slug) {
    throw new Error('Missing slug for app/blog/[slug]/page.tsx')
  }

  const { isEnabled: isDraft } = await draftMode()

  const matter = (await import('gray-matter')).default
  const { mdxSerialize } = await import('lib/mdx/mdxSerialize')

  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const content = parsedContent.content
    const tocDepth = (parsedContent.data as any)?.toc_depth ?? 3
    const mdxSource = await mdxSerialize(content, { tocDepth })
    const { generateReadingTime } = await import('lib/helpers')
    const blogPost = {
      ...parsedContent.data,
      slug,
      readingTime: generateReadingTime(content),
    }

    const allStaticPosts = getSortedPosts({ directory: '_blog' })
    const allPosts = [...allStaticPosts].sort((a, b) => {
      const aDate = new Date((a as unknown as { date: string }).date).getTime()
      const bDate = new Date((b as unknown as { date: string }).date).getTime()
      return bDate - aDate
    })
    const currentIndex = allPosts.findIndex((post) => post.slug === slug)
    const nextPost = currentIndex === allPosts.length - 1 ? null : allPosts[currentIndex + 1]
    const prevPost = currentIndex === 0 ? null : allPosts[currentIndex - 1]
    const tocResult = (mdxSource as any).scope?.toc || { content: '' }
    const processedContent = tocResult.content
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: (mdxSource as { scope: { tags?: string[] } }).scope.tags,
      currentPostSlug: slug,
    }) as unknown as (BlogData & PostReturnType)[]

    const props: BlogPostPageProps = {
      prevPost,
      nextPost,
      relatedPosts,
      blog: {
        ...(blogPost as any),
        slug,
        content: mdxSource,
        toc: {
          ...tocResult,
          content: processedContent,
        },
      } as any,
      isDraftMode: isDraft,
    }

    return <BlogPostClient {...props} />
  } catch {}

  // Try to fetch CMS post using our new unified API first
  let cmsPost = await getCMSPostFromAPI(slug, 'full', isDraft)

  // Fallback to the original method if the API doesn't return the post
  if (!cmsPost) {
    cmsPost = await getCMSPostBySlug(slug, isDraft)
  }

  if (!cmsPost) {
    if (isDraft) {
      // Try to fetch published version for draft mode
      let publishedPost = await getCMSPostFromAPI(slug, 'full', false)
      if (!publishedPost) {
        publishedPost = await getCMSPostBySlug(slug, false)
      }

      if (!publishedPost) return null

      const mdxSource = await mdxSerialize(publishedPost.content || '', {
        tocDepth: publishedPost.toc_depth || 3,
      })
      const tocResult = (mdxSource as any).scope?.toc || publishedPost.toc || { content: '' }
      const props: BlogPostPageProps = {
        prevPost: null,
        nextPost: null,
        relatedPosts: [],
        blog: {
          ...publishedPost,
          slug: publishedPost.slug ?? slug,
          tags: publishedPost.tags || [],
          authors: publishedPost.authors || [],
          isCMS: true,
          content: mdxSource,
          toc: tocResult,
          imgSocial: publishedPost.imgSocial ?? undefined,
          imgThumb: publishedPost.imgThumb ?? undefined,
          // Extract meta fields from CMS
          meta_title: publishedPost.meta?.title ?? undefined,
          meta_description: publishedPost.meta?.description ?? undefined,
          meta_image: publishedPost.meta?.image ?? publishedPost.imgThumb ?? undefined,
        } as any,
        isDraftMode: isDraft,
      }
      return <BlogPostClient {...props} />
    }
    return null
  }

  const tocDepth = cmsPost.toc_depth || 3

  // Use the new CMS content processor to handle blocks
  let processedContent: any

  try {
    processedContent = await processCMSContent(cmsPost.richContent || cmsPost.content, tocDepth)
  } catch (error) {
    console.warn('Error processing CMS content, falling back to legacy processing:', error)
    // Fallback to legacy processing
    const mdxSource = await mdxSerialize(cmsPost.content || '', { tocDepth })
    processedContent = {
      content: mdxSource,
      blocks: [],
      toc: (mdxSource as any).scope?.toc || cmsPost.toc || { content: '' },
      plainMarkdown: cmsPost.content || '',
    }
  }

  const props: BlogPostPageProps = {
    prevPost: null,
    nextPost: null,
    relatedPosts: [],
    blog: {
      ...cmsPost,
      slug: cmsPost.slug ?? slug,
      tags: cmsPost.tags || [],
      authors: cmsPost.authors || [],
      isCMS: true,
      content: processedContent.content,
      toc: processedContent.toc,
      toc_depth: cmsPost.toc_depth || 3,
      imgSocial: cmsPost.imgSocial ?? undefined,
      imgThumb: cmsPost.imgThumb ?? undefined,
      // Extract meta fields from CMS
      meta_title: cmsPost.meta?.title ?? undefined,
      meta_description: cmsPost.meta?.description ?? undefined,
      meta_image: cmsPost.meta?.image ?? cmsPost.imgThumb ?? undefined,
    } as any,
    isDraftMode: isDraft,
  }

  return <BlogPostClient {...props} />
}
