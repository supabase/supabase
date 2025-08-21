import BlogPostClient from './BlogPostClient'
import { draftMode } from 'next/headers'
import { getAllCMSPostSlugs, getCMSPostBySlug } from 'lib/get-cms-posts'
import { getAllPostSlugs, getPostdata, getSortedPosts } from 'lib/posts'
import { SITE_ORIGIN } from '~/lib/constants'

import type { Blog, BlogData, PostReturnType } from 'types/post'

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

    const response = await fetch(url.toString(), {
      // Use no-store to always get fresh data
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error('[getCMSPostFromAPI] Non-OK response:', response.status)
      return null
    }

    const data = await response.json()

    return data.success ? data.post : null
  } catch (error) {
    console.error('[getCMSPostFromAPI] Error:', error)
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

export default async function BlogPostPage({ params }: { params: Params }) {
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
    const blogPost = { ...parsedContent.data }

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
          tags: publishedPost.tags || [],
          authors: publishedPost.authors || [],
          isCMS: true,
          content: mdxSource,
          toc: tocResult,
          image: publishedPost.image ?? undefined,
          thumb: publishedPost.thumb ?? undefined,
        } as any,
        isDraftMode: isDraft,
      }
      return <BlogPostClient {...props} />
    }
    return null
  }

  const tocDepth = cmsPost.toc_depth || 3
  const mdxSource = await mdxSerialize(cmsPost.content || '', { tocDepth })
  const tocResult = (mdxSource as any).scope?.toc || cmsPost.toc || { content: '' }

  const props: BlogPostPageProps = {
    prevPost: null,
    nextPost: null,
    relatedPosts: [],
    blog: {
      ...cmsPost,
      tags: cmsPost.tags || [],
      authors: cmsPost.authors || [],
      isCMS: true,
      content: mdxSource,
      toc: tocResult,
      toc_depth: cmsPost.toc_depth || 3,
      image: cmsPost.image ?? undefined,
      thumb: cmsPost.thumb ?? undefined,
    } as any,
    isDraftMode: isDraft,
  }

  return <BlogPostClient {...props} />
}
