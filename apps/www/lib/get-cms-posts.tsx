import { convertRichTextToMarkdown } from './cms/convertRichTextToMarkdown'
import { CMS_SITE_ORIGIN } from './constants'
import { generateReadingTime } from './helpers'
import { generateTocFromMarkdown } from './toc'

// Payload API configuration
const PAYLOAD_URL = CMS_SITE_ORIGIN || 'http://localhost:3030'
const CMS_API_KEY = process.env.CMS_API_KEY

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
  imgThumb?: {
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
  meta?: {
    title?: string | null
    imgSocial?: (number | string | null) | Media
    description?: string | null
  }
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media".
 */
export interface Media {
  id: number
  alt?: string | null
  caption?: {
    root: {
      type: string
      children: {
        type: string
        version: number
        [k: string]: unknown
      }[]
      direction: ('ltr' | 'rtl') | null
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
      indent: number
      version: number
    }
    [k: string]: unknown
  } | null
  prefix?: string | null
  updatedAt: string
  createdAt: string
  url?: string | null
  thumbnailURL?: string | null
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
  sizes?: {
    thumbnail?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    square?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    small?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    medium?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    large?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    xlarge?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
    og?: {
      url?: string | null
      width?: number | null
      height?: number | null
      mimeType?: string | null
      filesize?: number | null
      filename?: string | null
    }
  }
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
  imgThumb: string | null
  url: string
  path: string
  isCMS: boolean
  tags: string[]
  content: string
  meta?: {
    title?: string | null
    imgSocial?: (number | string | null) | Media
    description?: string | null
  }
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
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
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
  } catch (_error) {
    // don't console error to avoid noise if env vars not set
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
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
        },
        // For published posts: allow static generation with revalidation
        next: { revalidate: 60 }, // 1 minute
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
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
        },
        // cache: 'no-store',
        next: { revalidate: 0 },
      })

      // If no draft found, try published version
      if (!response.ok || (await response.clone().json()).docs?.length === 0) {
        url = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&draft=false`
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
          },
          // cache: 'no-store',
          next: { revalidate: 0 },
        })
      }
    } else {
      // For non-preview mode, get published version
      url = `${PAYLOAD_URL}/api/posts?where[slug][equals]=${slug}&depth=2&draft=false`

      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
        },
        // For published posts: allow static generation with revalidation
        next: { revalidate: 60 }, // 1 minute
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
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
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
      post.toc_depth ? post.toc_depth : 3
    )

    // Extract imgThumb and imgSocial URLs from the nested structure
    const imgThumbUrl = post.imgThumb?.url
      ? typeof post.imgThumb.url === 'string' && post.imgThumb.url.includes('http')
        ? post.imgThumb.url
        : `${PAYLOAD_URL}${post.imgThumb.url}`
      : null
    const imgSocialUrl = post.meta?.imgSocial
      ? typeof post.meta?.imgSocial === 'string' && post.meta?.imgSocial.includes('http')
        ? post.meta?.imgSocial
        : `${PAYLOAD_URL}${post.meta?.imgSocial}`
      : imgThumbUrl

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
      toc_depth: post.toc_depth || 3,
      imgThumb: imgThumbUrl,
      imgSocial: imgSocialUrl,
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
          ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
        },
        // cache: 'no-store', // Ensure we always get fresh data
        next: { revalidate: 30 }, // Disable caching for this fetch
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

        // Extract imgThumb and imgSocial URLs from the nested structure (handle absolute and relative)
        const imgThumbUrl = post.imgThumb?.url
          ? typeof post.imgThumb.url === 'string' && post.imgThumb.url.includes('http')
            ? post.imgThumb.url
            : `${PAYLOAD_URL}${post.imgThumb.url}`
          : null
        const imgSocialUrl = post.meta?.imgSocial
          ? typeof post.meta?.imgSocial === 'string' && post.meta?.imgSocial.includes('http')
            ? post.meta?.imgSocial
            : `${PAYLOAD_URL}${post.meta?.imgSocial}`
          : imgThumbUrl

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
          toc_depth: post.toc_depth || 3,
          imgThumb: imgThumbUrl,
          imgSocial: imgSocialUrl,
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
  } catch (_error) {
    // don't console error to avoid noise if env vars not set
    return []
  }
}
