import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import { draftMode } from 'next/headers'

import { isNotNullOrUndefined } from '~/lib/helpers'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import { getAllCMSPostSlugs, getCMSPostBySlug, getAllCMSPosts } from '~/lib/cms-posts'
import authors from 'lib/authors.json'

import CTABanner from '~/components/CTABanner'
import LW11Summary from '~/components/LaunchWeek/11/LW11Summary'
import LW12Summary from '~/components/LaunchWeek/12/LWSummary'
import LW13Summary from '~/components/LaunchWeek/13/Releases/LWSummary'
import LW14Summary from '~/components/LaunchWeek/14/Releases/LWSummary'
import BlogLinks from '~/components/LaunchWeek/7/BlogLinks'
import LWXSummary from '~/components/LaunchWeek/X/LWXSummary'
import DefaultLayout from '~/components/Layouts/Default'
import { DraftModeBanner } from '~/components/Blog/DraftModeBanner'
import { BlogContent } from '../components/BlogContent'
import { AuthorList } from '../components/AuthorList'
import { BlogMarkdownProcessor } from '../components/BlogMarkdownProcessor'
import type { BlogData, CMSAuthor, StaticAuthor } from '../types'

type Post = ReturnType<typeof getSortedPosts>[number]

// Generate static params for all blog posts
export async function generateStaticParams() {
  // Get paths from static files
  const staticPaths = getAllPostSlugs('_blog')
  // Get paths from CMS
  const cmsPaths = await getAllCMSPostSlugs()
  // Combine both path sources
  return [...staticPaths, ...cmsPaths].map((path) => ({
    slug: path.params.slug,
  }))
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { isEnabled: isDraftMode } = draftMode()
  const slug = params.slug
  let blogData: BlogData | null = null

  try {
    // Try static post first
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as { data: BlogData }
    blogData = parsedContent.data
  } catch {
    // Try CMS post if static post not found
    const cmsPost = await getCMSPostBySlug(slug, isDraftMode)
    if (cmsPost) {
      blogData = {
        ...cmsPost,
        image: cmsPost.image || undefined,
        thumb: cmsPost.thumb || undefined,
        toc: undefined,
      }
    }
  }

  if (!blogData) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    }
  }

  const imageUrl = blogData.isCMS ? blogData.thumb! : `/images/blog/${blogData.thumb}`

  return {
    title: blogData.meta_title ?? blogData.title,
    description: blogData.meta_description ?? blogData.description,
    openGraph: {
      title: blogData.meta_title ?? blogData.title,
      description: blogData.meta_description ?? blogData.description,
      url: `https://supabase.com/blog/${blogData.slug}`,
      type: 'article',
      ...(blogData.video && {
        videos: [
          {
            url: blogData.video,
            type: 'application/x-shockwave-flash',
            width: 640,
            height: 385,
          },
        ],
      }),
      publishedTime: blogData.date,
      authors:
        blogData.authors?.map((author) => author.author_url).filter(isNotNullOrUndefined) ?? [],
      tags: blogData.tags?.map((tag) => (typeof tag === 'string' ? tag : tag.name)),
      images: [
        {
          url: imageUrl,
          alt: `${blogData.title} thumbnail`,
        },
      ],
    },
  }
}

const generateReadingTime = (text: string | undefined): string => {
  if (!text) return '0 min read'
  const wordsPerMinute = 200
  const numberOfWords = text.split(/\s/g).length
  const minutes = Math.ceil(numberOfWords / wordsPerMinute)
  return `${minutes} min read`
}

// Main page component
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { isEnabled: isDraftMode } = draftMode()
  const slug = params.slug

  let props: {
    prevPost: Post | null
    nextPost: Post | null
    relatedPosts: (Post & BlogData)[]
    blog: BlogData & {
      rawContent: string
      mdxSource: any
    }
    isDraftMode: boolean
  }

  // Try static post first
  try {
    const postContent = await getPostdata(slug, '_blog')
    const parsedContent = matter(postContent) as unknown as { data: BlogData; content: string }
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
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: mdxSource.scope.tags,
      currentPostSlug: slug,
    }) as unknown as (BlogData & Post)[]

    props = {
      prevPost,
      nextPost,
      relatedPosts,
      blog: {
        ...blogPost,
        rawContent: content,
        mdxSource,
      },
      isDraftMode,
    }
  } catch {
    // Try CMS post if static post not found
    const cmsPost = await getCMSPostBySlug(slug, isDraftMode)
    if (!cmsPost) {
      throw new Error('Post not found')
    }

    const content = cmsPost.content || ''
    const mdxSource = await mdxSerialize(content)

    props = {
      prevPost: null,
      nextPost: null,
      relatedPosts: [],
      blog: {
        ...cmsPost,
        tags: cmsPost.tags || [],
        authors: cmsPost.authors || [],
        isCMS: true,
        rawContent: content,
        mdxSource,
        image: cmsPost.image || undefined,
        thumb: cmsPost.thumb || undefined,
        toc: undefined,
      },
      isDraftMode,
    }
  }

  const { blog: blogMetaData, isDraftMode: isPreview } = props

  // For CMS posts, the author info is already included
  // For static posts, we need to look up the author in authors.json
  const author = blogMetaData.isCMS
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

  const imageUrl = blogMetaData.isCMS ? blogMetaData.thumb! : `/images/blog/${blogMetaData.thumb}`

  return (
    <>
      {isPreview && <DraftModeBanner />}
      <DefaultLayout className="overflow-x-hidden">
        <div className="container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16 xl:px-20">
          <div className="grid grid-cols-12 gap-4">
            <div className="hidden col-span-12 xl:block lg:col-span-2">
              <Link
                href="/blog"
                className="text-foreground-lighter hover:text-foreground flex cursor-pointer items-center text-sm transition"
              >
                <ChevronLeft style={{ padding: 0 }} />
                Back
              </Link>
            </div>
            <div className="col-span-12 lg:col-span-12 xl:col-span-10">
              <div className="mb-6 lg:mb-10 max-w-5xl space-y-8">
                <div className="space-y-4">
                  <Link href="/blog" className="text-brand hidden lg:inline-flex items-center">
                    Blog
                  </Link>
                  <h1 className="text-2xl sm:text-4xl">{blogMetaData.title}</h1>
                  <div className="text-light flex space-x-3 text-sm">
                    <p>{dayjs(blogMetaData.date).format('DD MMM YYYY')}</p>
                    <p>•</p>
                    <p>{generateReadingTime(blogMetaData.source)}</p>
                  </div>
                  <AuthorList authors={author} />
                </div>
              </div>
              <BlogContent
                content={props.blog.rawContent}
                mdxSource={props.blog.mdxSource}
                youtubeHero={blogMetaData.youtubeHero}
                thumb={blogMetaData.thumb}
                imageUrl={imageUrl}
                title={blogMetaData.title}
                tags={blogMetaData.tags}
                toc_depth={blogMetaData.toc_depth}
                prevPost={props.prevPost}
                nextPost={props.nextPost}
              />
            </div>
          </div>
        </div>
        <CTABanner />
        {blogMetaData.launchweek === '7' && <BlogLinks />}
        {blogMetaData.launchweek?.toString().toLowerCase() === 'x' && <LWXSummary />}
        {blogMetaData.launchweek?.toString().toLowerCase() === '11' && <LW11Summary />}
        {blogMetaData.launchweek?.toString().toLowerCase() === '12' && <LW12Summary />}
        {blogMetaData.launchweek?.toString().toLowerCase() === '13' && <LW13Summary />}
        {blogMetaData.launchweek?.toString().toLowerCase() === '14' && <LW14Summary />}
      </DefaultLayout>
    </>
  )
}
