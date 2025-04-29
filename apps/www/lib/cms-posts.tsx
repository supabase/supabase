import { generateReadingTime } from './helpers'
// @ts-ignore - Strapi client types are not properly exported
import { strapi } from '@strapi/client'
const toc = require('markdown-toc')

// Initialize Strapi client with authentication
const client = strapi({
  baseURL: process.env.CMS_API_URL || 'http://localhost:1337/api',
  auth: process.env.STRAPI_API_TOKEN, // You'll need to add this to your .env
})

type CMSBlogPost = {
  id: number
  Title: string
  slug: string
  description: string
  content: string
  date?: string
  launchweek?: string
  toc_depth?: number
  tags?: string[]
  thumb?: {
    url: string
  }
  image?: {
    url: string
  }
  publishedAt: string
  createdAt: string
  updatedAt: string
  authors?: {
    author: string
    author_id: string
    position: string
    author_url: string
    author_image_url: {
      url: string
    }
    username: string
  }[]
}

type CMSResponse = {
  data: CMSBlogPost[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

type PostSlug = {
  params: {
    slug: string
  }
}

type ProcessedPost = {
  slug: string
  title: string
  description: string
  date: string
  formattedDate: string
  readingTime: string
  authors: Array<{
    author: string
    author_id: string
    position: string
    author_url: string
    author_image_url: string | null
    username: string
  }>
  toc_depth: number
  thumb: string | null
  image: string | null
  url: string
  path: string
  isCMS: boolean
  tags: string[]
}

/**
 * Fetch all blog post slugs from the CMS
 */
export async function getAllCMSPostSlugs(): Promise<PostSlug[]> {
  try {
    const response = await client.collection('blog-posts').find({
      fields: ['slug'],
      pagination: {
        pageSize: 100,
      },
    })

    return response.data.map((post: CMSBlogPost) => ({
      params: {
        slug: post.slug,
      },
    }))
  } catch (error) {
    console.error('Error fetching CMS post slugs:', error)
    return []
  }
}

/**
 * Fetch a single blog post from the CMS by slug
 */
export async function getCMSPostBySlug(slug: string) {
  try {
    const response = await client.collection('blog-posts').find({
      filters: {
        slug: {
          $eq: slug,
        },
      },
      populate: ['authors.author_image_url', 'tags', 'categories', 'thumb', 'image'],
    })

    if (!response.data.length) {
      return null
    }

    const post = response.data[0]

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)
    const readingTime = generateReadingTime(post.content || '')

    // Extract thumb and image URLs from the nested structure
    const thumbUrl = (post.thumb as any)?.url
    const imageUrl = (post.image as any)?.url

    // Generate TOC from content for CMS posts
    const tocResult = toc(post.content || '', {
      maxdepth: post.toc_depth ? post.toc_depth : 2,
    })
    const processedContent = tocResult.content.replace(/%23/g, '')

    return {
      slug,
      source: post.content || '',
      title: post.Title || 'Untitled Post',
      date: post.date || new Date().toISOString(),
      formattedDate,
      readingTime,
      launchweek: post.launchweek || null,
      authors:
        post.authors?.map((author: any) => ({
          author: author.author || 'Unknown Author',
          author_id: author.author_id || '',
          position: author.position || '',
          author_url: author.author_url || '#',
          author_image_url: author.author_image_url?.url
            ? author.author_image_url.url.includes('http')
              ? author.author_image_url?.url
              : `${process.env.CMS_API_URL}${author.author_image_url.url}`
            : null,
          username: author.username || '',
        })) || [],
      toc_depth: post.toc_depth || 2,
      thumb: thumbUrl ? thumbUrl.replace(process.env.CMS_API_URL || '', '') : null,
      image: imageUrl ? imageUrl.replace(process.env.CMS_API_URL || '', '') : null,
      url: `/blog/${slug}`,
      path: `/blog/${slug}`,
      isCMS: true,
      content: post.content || '',
      tags: post.tags || [],
      toc: {
        content: processedContent,
        json: tocResult.json,
      },
    }
  } catch (error) {
    console.error('Error fetching CMS post by slug:', error)
    return null
  }
}

/**
 * Fetch all blog posts from the CMS
 */
export async function getAllCMSPosts({
  limit,
  tags,
  currentPostSlug,
}: {
  limit?: number
  tags?: string[]
  currentPostSlug?: string
} = {}): Promise<ProcessedPost[]> {
  try {
    const response = await client.collection('blog-posts').find({
      populate: ['authors.author_image_url', 'categories', 'thumb', 'image'],
      pagination: {
        pageSize: 100,
      },
    })

    let posts = response.data
      .filter((post: CMSBlogPost) => post.slug !== currentPostSlug)
      .map((post: CMSBlogPost) => {
        const options: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }
        const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)
        const readingTime = generateReadingTime(post.content || '')

        // Extract thumb and image URLs from the nested structure
        const thumbUrl = (post.thumb as any)?.url
        const imageUrl = (post.image as any)?.url

        console.log('imageUrl', imageUrl)

        return {
          slug: post.slug || '',
          title: post.Title || '',
          description: post.description || '',
          date: post.date || new Date().toISOString(),
          formattedDate,
          readingTime,
          authors:
            post.authors?.map((author: any) => ({
              author: author.author || '',
              author_id: author.author_id || '',
              position: author.position || '',
              author_url: author.author_url || '#',
              author_image_url: author.author_image_url?.url
                ? author.author_image_url.url.includes('http')
                  ? author.author_image_url.url
                  : `${process.env.CMS_API_URL}${author.author_image_url.url}`
                : null,
              username: author.username || '',
            })) || [],
          toc_depth: post.toc_depth || 2,
          thumb: thumbUrl ? thumbUrl.replace(process.env.CMS_API_URL || '', '') : null,
          image: imageUrl ? imageUrl.replace(process.env.CMS_API_URL || '', '') : null,
          url: `/blog/${post.slug || ''}`,
          path: `/blog/${post.slug || ''}`,
          isCMS: true,
          tags: post.tags || [],
        }
      })

    // Sort by date (newest first)
    posts = posts.sort(
      (a: ProcessedPost, b: ProcessedPost) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      posts = posts.filter((post: ProcessedPost) => {
        const found = tags.some((tag) => post.tags?.includes(tag))
        return found
      })
    }

    // Limit results if specified
    if (limit) {
      posts = posts.slice(0, limit)
    }

    return posts
  } catch (error) {
    console.error('Error fetching all CMS posts:', error)
    return []
  }
}
