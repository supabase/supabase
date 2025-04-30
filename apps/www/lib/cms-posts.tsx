import { generateReadingTime } from './helpers'
const toc = require('markdown-toc')

// Payload API configuration
const PAYLOAD_API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000/api'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY

type CMSBlogPost = {
  id: string
  Title: string
  slug: string
  description: string
  content: any
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
export async function getAllCMSPostSlugs() {
  try {
    const response = await fetch(`${PAYLOAD_API_URL}/blog-posts?limit=100&depth=0`, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.docs.map((post: CMSBlogPost) => ({
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
    const response = await fetch(
      `${PAYLOAD_API_URL}/blog-posts?where[slug][equals]=${slug}&depth=2`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.docs.length) {
      return null
    }

    const post = data.docs[0]

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)
    const readingTime = generateReadingTime(post.content || '')

    // Extract thumb and image URLs from the nested structure
    const thumbUrl = post.thumb?.url
    const imageUrl = post.image?.url

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
              : `${PAYLOAD_API_URL.replace('/api', '')}${author.author_image_url.url}`
            : null,
          username: author.username || '',
        })) || [],
      toc_depth: post.toc_depth || 2,
      thumb: thumbUrl ? thumbUrl.replace(PAYLOAD_API_URL.replace('/api', ''), '') : null,
      image: imageUrl ? imageUrl.replace(PAYLOAD_API_URL.replace('/api', ''), '') : null,
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
    const response = await fetch(`${PAYLOAD_API_URL}/blog-posts?depth=2&limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    let posts = data.docs
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
        const thumbUrl = post.thumb?.url
        const imageUrl = post.image?.url

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
                  : `${PAYLOAD_API_URL.replace('/api', '')}${author.author_image_url.url}`
                : null,
              username: author.username || '',
            })) || [],
          toc_depth: post.toc_depth || 2,
          thumb: thumbUrl ? thumbUrl.replace(PAYLOAD_API_URL.replace('/api', ''), '') : null,
          image: imageUrl ? imageUrl.replace(PAYLOAD_API_URL.replace('/api', ''), '') : null,
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
