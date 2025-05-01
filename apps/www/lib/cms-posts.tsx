import { generateReadingTime } from './helpers'
const toc = require('markdown-toc')

// Payload API configuration
const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY

type CMSBlogPost = {
  id: string
  title: string
  slug: string
  description: string
  content: {
    root: {
      children: Array<{
        type: string
        children: Array<{
          text: string
          type: string
          [key: string]: any
        }>
        [key: string]: any
      }>
    }
  }
  date?: string
  launchweek?: string
  toc_depth?: number
  readingTime?: number
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
  content: string
}

/**
 * Convert Payload rich text content to markdown
 */
function convertRichTextToMarkdown(content: CMSBlogPost['content']): string {
  if (!content?.root?.children) return ''

  return content.root.children
    .map((node) => {
      if (node.type === 'heading') {
        const level = node.tag?.replace('h', '') || '1'
        const text = node.children?.map((child) => child.text).join('') || ''
        return `${'#'.repeat(Number(level))} ${text}`
      }
      if (node.type === 'paragraph') {
        return node.children?.map((child) => child.text).join('') || ''
      }
      if (node.type === 'list') {
        const items = node.children
          ?.map((item) => {
            if (item.type === 'list-item') {
              return `- ${item.children?.map((child: { text: any }) => child.text).join('') || ''}`
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
        return items
      }
      if (node.type === 'link') {
        const text = node.children?.map((child) => child.text).join('') || ''
        const url = node.url || ''
        return `[${text}](${url})`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Fetch all blog post slugs from the CMS
 */
export async function getAllCMSPostSlugs() {
  try {
    const response = await fetch(`${PAYLOAD_URL}/api/posts?limit=100&depth=1`, {
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
    const response = await fetch(`${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2`, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
    })

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
    const markdownContent = convertRichTextToMarkdown(post.content)
    const readingTime = post.readingTime || generateReadingTime(markdownContent)

    // Extract thumb and image URLs from the nested structure
    const thumbUrl = `${PAYLOAD_URL}${post.thumb?.url}`
    const imageUrl = `${PAYLOAD_URL}${post.image?.url}`

    // Generate TOC from content for CMS posts
    const tocResult = toc(markdownContent, {
      maxdepth: post.toc_depth ? post.toc_depth : 2,
    })

    return {
      slug,
      source: markdownContent,
      title: post.title || 'Untitled Post',
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
              : `${PAYLOAD_URL}${author.author_image_url.url}`
            : null,
          username: author.username || '',
        })) || [],
      toc_depth: post.toc_depth || 2,
      thumb: thumbUrl,
      image: imageUrl,
      url: `/blog/${slug}`,
      path: `/blog/${slug}`,
      isCMS: true,
      content: markdownContent,
      tags: post.tags || [],
      toc: {
        content: tocResult.content,
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
    const response = await fetch(`${PAYLOAD_URL}/api/posts?depth=1&draft=false`, {
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
        const markdownContent = convertRichTextToMarkdown(post.content)
        const readingTime = post.readingTime || generateReadingTime(markdownContent)

        // Extract thumb and image URLs from the nested structure
        const thumbUrl = `${PAYLOAD_URL}${post.thumb?.url}`
        const imageUrl = `${PAYLOAD_URL}${post.image?.url}`

        return {
          slug: post.slug || '',
          title: post.title || '',
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
              // author_image_url: author.author_image_url?.url
              //   ? author.author_image_url.url.includes('http')
              //     ? author.author_image_url.url
              //     : `${PAYLOAD_URL}${author.author_image_url.url}`
              //   : null,
              author_image_url: author.author_image_url?.url
                ? `${PAYLOAD_URL}${author.author_image_url.url}`
                : null,
              username: author.username || '',
            })) || [],
          toc_depth: post.toc_depth || 2,
          thumb: thumbUrl,
          image: imageUrl,
          url: `/blog/${post.slug || ''}`,
          path: `/blog/${post.slug || ''}`,
          isCMS: true,
          tags: post.tags || [],
          content: markdownContent,
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
