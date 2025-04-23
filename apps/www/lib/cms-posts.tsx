import { generateReadingTime } from './helpers'
const toc = require('markdown-toc')

type CMSBlogPost = {
  id: number
  Title: string
  slug: string
  content: string
  date: string
  author: string
  author_image_url?: string
  author_url?: string
  position?: string
  toc_depth?: number
  tags?: string[]
  thumb?: {
    data?: {
      url: string
    }
  }
  image?: {
    data?: {
      url: string
    }
  }
  publishedAt: string
  createdAt: string
  updatedAt: string
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

// The base URL of your CMS API
const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:1337'

/**
 * Fetch all blog post slugs from the CMS
 */
export async function getAllCMSPostSlugs() {
  try {
    const response = await fetch(
      `${CMS_API_URL}/api/blog-posts?fields[0]=slug&pagination[pageSize]=100`
    )

    if (!response.ok) {
      console.error('Failed to fetch CMS posts')
      return []
    }

    const data: CMSResponse = await response.json()

    return data.data.map((post) => ({
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
      `${CMS_API_URL}/api/blog-posts?filters[slug][$eq]=${slug}&populate=*`
    )

    if (!response.ok) {
      return null
    }

    const data: CMSResponse = await response.json()

    if (!data.data.length) {
      return null
    }

    const post = data.data[0]
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)
    const readingTime = generateReadingTime(post.content || '')

    // Extract thumb and image URLs from the nested structure
    const thumbUrl = post.thumb?.data?.url
    const imageUrl = post.image?.data?.url

    // Generate TOC from content
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
      author: post.author || 'Unknown Author',
      author_image_url: post.author_image_url || null,
      author_url: post.author_url || '#',
      position: post.position || '',
      toc_depth: post.toc_depth || 2,
      thumb: thumbUrl ? thumbUrl.replace(CMS_API_URL, '') : null,
      image: imageUrl ? imageUrl.replace(CMS_API_URL, '') : null,
      url: `/blog/${slug}`,
      path: `/blog/${slug}`,
      isCMS: true,
      content: post.content || '',
      tags: post.tags || [],
      toc: {
        ...tocResult,
        content: processedContent,
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
} = {}) {
  try {
    console.log(
      'Fetching CMS posts from:',
      `${CMS_API_URL}/api/blog-posts?populate=*&pagination[pageSize]=100`
    )

    const response = await fetch(
      `${CMS_API_URL}/api/blog-posts?populate=*&pagination[pageSize]=100`
    )

    if (!response.ok) {
      console.error('CMS API response not OK:', response.status, response.statusText)
      return []
    }

    const data: CMSResponse = await response.json()
    console.log('CMS API response data:', {
      totalPosts: data.data.length,
      pagination: data.meta.pagination,
      firstPost: data.data[0]
        ? {
            slug: data.data[0].slug,
            title: data.data[0].Title,
          }
        : 'No posts found',
    })

    console.log('data', data)

    let posts = data.data
      .filter((post) => post.slug !== currentPostSlug)
      .map((post) => {
        const options: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }
        const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)
        const readingTime = generateReadingTime(post.content || '')

        // Extract thumb and image URLs from the nested structure
        const thumbUrl = post.thumb?.data?.url
        const imageUrl = post.image?.data?.url

        return {
          slug: post.slug || '',
          title: post.Title || 'Untitled Post',
          date: post.date || new Date().toISOString(),
          formattedDate,
          readingTime,
          author: post.author || 'Unknown Author',
          author_image_url: post.author_image_url || null,
          author_url: post.author_url || '#',
          position: post.position || '',
          thumb: thumbUrl ? thumbUrl.replace(CMS_API_URL, '') : null,
          image: imageUrl ? imageUrl.replace(CMS_API_URL, '') : null,
          url: `/blog/${post.slug || ''}`,
          path: `/blog/${post.slug || ''}`,
          isCMS: true,
          tags: post.tags || [],
        }
      })

    console.log('Processed CMS posts:', posts.length)

    // Sort by date (newest first)
    posts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      // Note: This assumes tags are added to CMS content
      // You'll need to add a tags field to your CMS model
      // posts = posts.filter(post => {
      //   const found = tags.some(tag => post.tags?.includes(tag))
      //   return found
      // })
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
