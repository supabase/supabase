import { CMS_SITE_ORIGIN } from './constants'
import { generateReadingTime } from './helpers'
import { generateTocFromMarkdown } from './toc'

// Payload API configuration
const PAYLOAD_URL = CMS_SITE_ORIGIN || 'http://localhost:3030'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

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
  categories?: string[]
  tags?: string[]
  industry?: string[]
  supabase_products?: string[]
  company_size?: string
  region?: string
  logo?: string
  logo_inverse?: string
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
  industry?: string[]
  supabase_products?: string[]
  company_size?: string
  region?: string
  logo?: string
  logo_inverse?: string
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
        const level = node.tag && typeof node.tag === 'string' ? node.tag.replace('h', '') : '1'
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
    const response = await fetch(
      `${PAYLOAD_URL}/api/posts?limit=100&depth=1&draft=false&where[_status][equals]=published`,
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

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      const body = await response.text()
      console.warn(
        `[getAllCMSPostSlugs] Non-JSON response from ${PAYLOAD_URL}/api/posts (content-type: '${contentType}'). Returning empty slugs. Body (truncated): ${body.slice(
          0,
          200
        )}`
      )
      return []
    }
    const data = await response.json()
    // console.log(
    //   '[getAllCMSPostSlugs] Found posts:',
    //   data.docs.map((post: any) => ({
    //     id: post.id,
    //     title: post.title,
    //     slug: post.slug,
    //     status: post._status,
    //   }))
    // )

    return data.docs
      .filter((post: CMSBlogPost) => post.slug) // Filter out posts with null/undefined slugs
      .map((post: CMSBlogPost) => ({
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
export async function getCMSPostBySlug(slug: string, preview = false) {
  // console.log(
  //   `[getCMSPostBySlug] Fetching post '${slug}', preview: ${preview}, from ${PAYLOAD_URL}`
  // )

  try {
    let url: string
    let response: Response

    if (!preview) {
      // For published posts, try to get the latest published version using versions API
      const versionsUrl = `${PAYLOAD_URL}/api/posts/versions?where[version.slug][equals]=${slug}&where[version._status][equals]=published&sort=-updatedAt&limit=1&depth=2`

      response = await fetch(versionsUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const versionsData = await response.json()
        if (versionsData.docs && versionsData.docs.length > 0) {
          const latestPublishedVersion = versionsData.docs[0].version
          if (latestPublishedVersion) {
            return processPostData(latestPublishedVersion)
          }
        }
      }
    }

    // Fallback to regular API (for preview mode or if versions API fails)
    if (preview) {
      // In preview mode, always try to get the latest draft first
      url = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&draft=true`

      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      // If no draft found, try published version
      if (!response.ok || (await response.clone().json()).docs?.length === 0) {
        url = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&draft=false`
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
          },
          cache: 'no-store',
          next: { revalidate: 0 },
        })
      }
    } else {
      // For non-preview mode, get published version
      url = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&draft=false`

      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      })
    }

    if (!response.ok) {
      console.error(`[getCMSPostBySlug] HTTP error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`[getCMSPostBySlug] Error response body:`, errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      const body = await response.text()
      console.warn(
        `[getCMSPostBySlug] Non-JSON response from ${url} (content-type: '${contentType}'). Returning null. Body (truncated): ${body.slice(
          0,
          200
        )}`
      )
      return null
    }
    const data = await response.json()

    if (!data.docs.length && !preview) {
      return null
    }

    // If we're in preview mode and there's no draft, try to get the published version
    if (!data.docs.length && preview) {
      const publishedUrl = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2`

      const publishedResponse = await fetch(publishedUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
      })

      if (!publishedResponse.ok) {
        console.error(
          `[getCMSPostBySlug] HTTP error for published version: ${publishedResponse.status}`
        )
        throw new Error(`HTTP error! status: ${publishedResponse.status}`)
      }

      const publishedContentType = publishedResponse.headers.get('content-type') || ''
      if (!publishedContentType.toLowerCase().includes('application/json')) {
        const body = await publishedResponse.text()
        console.warn(
          `[getCMSPostBySlug] Non-JSON response from ${publishedUrl} (content-type: '${publishedContentType}'). Returning null. Body (truncated): ${body.slice(
            0,
            200
          )}`
        )
        return null
      }
      const publishedData = await publishedResponse.json()

      if (!publishedData.docs.length) {
        return null
      }

      return processPostData(publishedData.docs[0])
    }

    // If we have a post (either draft or published), process it
    const post = data.docs[0]

    try {
      const processedPost = await processPostData(post)

      return processedPost
    } catch (error) {
      console.error(`[getCMSPostBySlug] Error in processPostData:`, error)
      return null
    }
  } catch (error) {
    console.error('Error fetching CMS post by slug:', error)
    return null
  }
}

// Helper function to process post data
async function processPostData(post: any) {
  try {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)

    const markdownContent = convertRichTextToMarkdown(post.content)

    const readingTime = post.readingTime || generateReadingTime(markdownContent)

    // Generate TOC from content for CMS blog posts
    const tocResult = await generateTocFromMarkdown(
      markdownContent,
      post.toc_depth ? post.toc_depth : 2
    )

    // Extract thumb and image URLs from the nested structure
    const thumbUrl = post.thumb?.url
      ? typeof post.thumb.url === 'string' && post.thumb.url.includes('http')
        ? post.thumb.url
        : `${PAYLOAD_URL}${post.thumb.url}`
      : null
    const imageUrl = post.image?.url
      ? typeof post.image.url === 'string' && post.image.url.includes('http')
        ? post.image.url
        : `${PAYLOAD_URL}${post.image.url}`
      : null

    const processedData = {
      slug: post.slug,
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
            ? typeof author.author_image_url.url === 'string' &&
              author.author_image_url.url.includes('http')
              ? author.author_image_url?.url
              : `${PAYLOAD_URL}${author.author_image_url.url}`
            : null,
          username: author.username || '',
        })) || [],
      toc_depth: post.toc_depth || 2,
      thumb: thumbUrl,
      image: imageUrl,
      url: `/blog/${post.slug}`,
      path: `/blog/${post.slug}`,
      isCMS: true,
      content: markdownContent,
      richContent: post.content,
      categories: post.categories?.map((category: any) => category.name) || [],
      tags: post.tags || [],
      toc: {
        content: tocResult.content,
        json: tocResult.json,
      },
    }

    return processedData
  } catch (error) {
    console.error(`[processPostData] Error processing post data:`, error)
    throw error
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
    const response = await fetch(
      `${PAYLOAD_URL}/api/posts?depth=2&draft=false&where[_status][equals]=published`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
        cache: 'no-store', // Ensure we always get fresh data
        next: { revalidate: 0 }, // Disable caching for this fetch
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      const body = await response.text()
      console.warn(
        `[getAllCMSPosts] Non-JSON response from ${PAYLOAD_URL}/api/posts (content-type: '${contentType}'). Returning empty posts. Body (truncated): ${body.slice(
          0,
          200
        )}`
      )
      return []
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

        // Extract thumb and image URLs from the nested structure (handle absolute and relative)
        const thumbUrl = post.thumb?.url
          ? typeof post.thumb.url === 'string' && post.thumb.url.includes('http')
            ? post.thumb.url
            : `${PAYLOAD_URL}${post.thumb.url}`
          : null
        const imageUrl = post.image?.url
          ? typeof post.image.url === 'string' && post.image.url.includes('http')
            ? post.image.url
            : `${PAYLOAD_URL}${post.image.url}`
          : null

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
              author_image_url: author.author_image_url?.url
                ? typeof author.author_image_url.url === 'string' &&
                  author.author_image_url.url.includes('http')
                  ? author.author_image_url.url
                  : `${PAYLOAD_URL}${author.author_image_url.url}`
                : null,
              username: author.username || '',
            })) || [],
          toc_depth: post.toc_depth || 2,
          thumb: thumbUrl,
          image: imageUrl,
          url: `/blog/${post.slug || ''}`,
          path: `/blog/${post.slug || ''}`,
          isCMS: true,
          categories: post.categories?.map((category: any) => category.name) || [],
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
