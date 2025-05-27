import { generateReadingTime } from './helpers'
const toc = require('markdown-toc')

// Payload API configuration
const PAYLOAD_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY

type CMSEvent = {
  id: string
  title: string
  subtitle?: string
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

type ProcessedEvent = {
  slug: string
  title: string
  subtitle?: string
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
function convertRichTextToMarkdown(content: CMSEvent['content']): string {
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
 * Fetch all event slugs from the CMS
 */
export async function getAllCMSEventSlugs() {
  try {
    const response = await fetch(
      `${PAYLOAD_URL}/api/events?limit=100&depth=1&draft=false&where[_status][equals]=published`,
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
    return data.docs.map((event: CMSEvent) => ({
      params: {
        slug: event.slug,
      },
    }))
  } catch (error) {
    console.error('Error fetching CMS event slugs:', error)
    return []
  }
}

/**
 * Fetch a single event from the CMS by slug
 */
export async function getCMSEventBySlug(slug: string, preview = false) {
  const PAYLOAD_URL =
    process.env.NEXT_PUBLIC_CMS_URL || process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030'
  console.log(
    `[getCMSEventBySlug] Fetching event '${slug}', preview: ${preview}, from ${PAYLOAD_URL}`
  )

  try {
    // When in preview mode, specify draft=true to get the latest draft content
    const url = `${PAYLOAD_URL}/api/events?where[slug][equals]=${slug}&depth=2${preview ? '&draft=true' : ''}`
    console.log(`[getCMSEventBySlug] API URL: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
      // Important: don't cache draft content
      cache: preview ? 'no-store' : 'default',
    })

    if (!response.ok) {
      console.error(`[getCMSEventBySlug] HTTP error: ${response.status} ${response.statusText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(
      `[getCMSEventBySlug] API responded with ${data.docs?.length || 0} events, draft mode: ${preview}`
    )

    // In preview mode, we want to return the draft even if it's not published
    if (!data.docs.length && !preview) {
      console.log(`[getCMSEventBySlug] No docs found, not in preview mode, returning null`)
      return null
    }

    // If we're in preview mode and there's no draft, try to get the published version
    if (!data.docs.length && preview) {
      console.log(
        `[getCMSEventBySlug] No draft found but in preview mode, trying published version`
      )
      const publishedUrl = `${PAYLOAD_URL}/api/events?where[slug][equals]=${slug}&depth=2`
      console.log(`[getCMSEventBySlug] Published API URL: ${publishedUrl}`)

      const publishedResponse = await fetch(publishedUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
      })

      if (!publishedResponse.ok) {
        console.error(
          `[getCMSEventBySlug] HTTP error for published version: ${publishedResponse.status}`
        )
        throw new Error(`HTTP error! status: ${publishedResponse.status}`)
      }

      const publishedData = await publishedResponse.json()
      console.log(
        `[getCMSEventBySlug] Published API responded with ${publishedData.docs?.length || 0} events`
      )

      if (!publishedData.docs.length) {
        console.log(`[getCMSEventBySlug] No published version found either, returning null`)
        return null
      }

      console.log(`[getCMSEventBySlug] Found published version, returning that instead of draft`)
      return processEventData(publishedData.docs[0])
    }

    console.log(
      `[getCMSEventBySlug] Found ${preview ? 'draft' : 'published'} event, processing data`
    )

    // If we have a event (either draft or published), process it
    const event = data.docs[0]

    // Let's log some key data to ensure it's what we expect
    console.log(`[getCMSEventBySlug] event title: ${event.title}`)
    console.log(`[getCMSEventBySlug] event status: ${event._status || 'published'}`)
    console.log(`[getCMSEventBySlug] event content type:`, typeof event.content)

    return processEventData(event)
  } catch (error) {
    console.error('Error fetching CMS event by slug:', error)
    return null
  }
}

// Helper function to process event data
function processEventData(event: any) {
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  const formattedDate = new Date(event.date || new Date()).toLocaleDateString('en-IN', options)
  const markdownContent = convertRichTextToMarkdown(event.content)
  const readingTime = event.readingTime || generateReadingTime(markdownContent)

  // Extract thumb and image URLs from the nested structure
  const thumbUrl = event.thumb?.url ? `${PAYLOAD_URL}${event.thumb.url}` : null
  const imageUrl = event.image?.url ? `${PAYLOAD_URL}${event.image.url}` : null

  // Generate TOC from content for CMS events
  const tocResult = toc(markdownContent, {
    maxdepth: event.toc_depth ? event.toc_depth : 2,
  })

  return {
    slug: event.slug,
    source: markdownContent,
    title: event.title || 'Untitled event',
    subtitle: event.subtitle || '',
    date: event.date || new Date().toISOString(),
    formattedDate,
    readingTime,
    launchweek: event.launchweek || null,
    authors:
      event.authors?.map((author: any) => ({
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
    toc_depth: event.toc_depth || 2,
    thumb: thumbUrl,
    image: imageUrl,
    url: `/events/${event.slug}`,
    path: `/events/${event.slug}`,
    isCMS: true,
    content: markdownContent,
    tags: event.tags || [],
    toc: {
      content: tocResult.content,
      json: tocResult.json,
    },
  }
}

/**
 * Fetch all events from the CMS
 */
export async function getAllCMSEvents({
  limit,
  tags,
  currentEventSlug,
}: {
  limit?: number
  tags?: string[]
  currentEventSlug?: string
} = {}): Promise<ProcessedEvent[]> {
  try {
    const response = await fetch(
      `${PAYLOAD_URL}/api/events?depth=1&draft=false&where[_status][equals]=published`,
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

    let events = data.docs
      .filter((event: CMSEvent) => event.slug !== currentEventSlug)
      .map((event: CMSEvent) => {
        const options: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }
        const formattedDate = new Date(event.date || new Date()).toLocaleDateString(
          'en-IN',
          options
        )
        const markdownContent = convertRichTextToMarkdown(event.content)
        const readingTime = event.readingTime || generateReadingTime(markdownContent)

        // Extract thumb and image URLs from the nested structure
        const thumbUrl = `${PAYLOAD_URL}${event.thumb?.url}`
        const imageUrl = `${PAYLOAD_URL}${event.image?.url}`

        return {
          slug: event.slug || '',
          title: event.title || '',
          subtitle: event.subtitle || '',
          description: event.description || '',
          date: event.date || new Date().toISOString(),
          formattedDate,
          readingTime,
          authors:
            event.authors?.map((author: any) => ({
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
          toc_depth: event.toc_depth || 2,
          thumb: thumbUrl,
          image: imageUrl,
          url: `/events/${event.slug || ''}`,
          path: `/events/${event.slug || ''}`,
          isCMS: true,
          tags: event.tags || [],
          content: markdownContent,
        }
      })

    // Sort by date (newest first)
    events = events.sort(
      (a: ProcessedEvent, b: ProcessedEvent) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      events = events.filter((event: ProcessedEvent) => {
        const found = tags.some((tag) => event.tags?.includes(tag))
        return found
      })
    }

    // Limit results if specified
    if (limit) {
      events = events.slice(0, limit)
    }

    return events
  } catch (error) {
    console.error('Error fetching all CMS events:', error)
    return []
  }
}
