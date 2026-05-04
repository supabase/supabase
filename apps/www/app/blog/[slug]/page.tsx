import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import BlogPostClient from './BlogPostClient'
import authors from '@/lib/authors.json'
import {
  BLOG_PLACEHOLDER_IMAGE,
  getAbsoluteBlogSocialImage,
  toAbsoluteBlogImageUrl,
} from '@/lib/blog-images'
import { SITE_ORIGIN } from '@/lib/constants'
import { blogPostingSchema, serializeJsonLd } from '@/lib/json-ld'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '@/lib/posts'
import type { Blog, BlogData, PostReturnType } from '@/types/post'

function resolveBlogAuthors(authorField: string | undefined) {
  return (authorField ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => authors.find((a) => a.author_id === id))
    .filter((a): a is (typeof authors)[number] => Boolean(a))
    .map((a) => ({ name: a.author, url: a.author_url }))
}

export const revalidate = 30

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
  return [...staticPaths].map((p) => ({ slug: p.params.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params

  if (!slug) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const matter = (await import('gray-matter')).default

  // Try to get static markdown post first
  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const blogPost = parsedContent.data
    const metaImageUrl = getAbsoluteBlogSocialImage(blogPost, SITE_ORIGIN)

    return {
      title: blogPost.title,
      description: blogPost.description,
      alternates: {
        types: {
          'text/markdown': `/blog/${slug}.md`,
        },
      },
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
  } catch {}
  return {
    title: 'Blog Post Not Found',
    description: 'The requested blog post could not be found.',
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

    const frontmatter = parsedContent.data
    const blogAuthors = resolveBlogAuthors(frontmatter.author)
    const imageUrl =
      getAbsoluteBlogSocialImage(frontmatter, SITE_ORIGIN) ??
      toAbsoluteBlogImageUrl(BLOG_PLACEHOLDER_IMAGE, SITE_ORIGIN)
    const blogJsonLd = blogPostingSchema({
      url: `${SITE_ORIGIN}/blog/${slug}`,
      headline: frontmatter.title,
      description: frontmatter.description,
      image: imageUrl,
      datePublished: frontmatter.date,
      authors: blogAuthors.length > 0 ? blogAuthors : [{ name: 'Supabase' }],
    })

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogJsonLd) }}
        />
        <BlogPostClient {...props} />
      </>
    )
  } catch {}
}
