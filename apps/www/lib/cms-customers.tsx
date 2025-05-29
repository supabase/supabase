import { generateReadingTime } from './helpers'
const toc = require('markdown-toc')

// Payload API configuration
const PAYLOAD_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY

type CMSCustomer = {
  id: string
  name: string
  title?: string
  slug: string
  description: string
  about?: string
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
  logo?: {
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

type ProcessedCustomer = {
  slug: string
  name: string
  title?: string
  description?: string
  about?: string
  date: string
  formattedDate: string
  readingTime?: string
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
  industry?: string[]
  supabase_products?: string[]
  company_size?: string
  region?: string
  logo?: string
  logo_inverse?: string
}

/**
 * Convert Payload rich text content to markdown
 */
function convertRichTextToMarkdown(content: CMSCustomer['content']): string {
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
 * Fetch all customer slugs from the CMS
 */
export async function getAllCMSCustomerSlugs() {
  try {
    const response = await fetch(
      `${PAYLOAD_URL}/api/customers?limit=100&depth=1&draft=false&where[_status][equals]=published`,
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
    return data.docs.map((customer: CMSCustomer) => ({
      params: {
        slug: customer.slug,
      },
    }))
  } catch (error) {
    console.error('Error fetching CMS customer slugs:', error)
    return []
  }
}

/**
 * Fetch a single customer from the CMS by slug
 */
export async function getCMSCustomerBySlug(slug: string, preview = false) {
  const PAYLOAD_URL =
    process.env.NEXT_PUBLIC_CMS_URL || process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3030'
  console.log(
    `[getCMSCustomerBySlug] Fetching customer '${slug}', preview: ${preview}, from ${PAYLOAD_URL}`
  )

  try {
    // When in preview mode, specify draft=true to get the latest draft content
    const url = `${PAYLOAD_URL}/api/customers?where[slug][equals]=${slug}&depth=2${preview ? '&draft=true' : ''}`
    console.log(`[getCMSCustomerBySlug] API URL: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
      // Important: don't cache draft content
      cache: preview ? 'no-store' : 'default',
    })

    if (!response.ok) {
      console.error(`[getCMSCustomerBySlug] HTTP error: ${response.status} ${response.statusText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(
      `[getCMSCustomerBySlug] API responded with ${data.docs?.length || 0} customers, draft mode: ${preview}`
    )

    // In preview mode, we want to return the draft even if it's not published
    if (!data.docs.length && !preview) {
      console.log(`[getCMSCustomerBySlug] No docs found, not in preview mode, returning null`)
      return null
    }

    // If we're in preview mode and there's no draft, try to get the published version
    if (!data.docs.length && preview) {
      console.log(
        `[getCMSCustomerBySlug] No draft found but in preview mode, trying published version`
      )
      const publishedUrl = `${PAYLOAD_URL}/api/customers?where[slug][equals]=${slug}&depth=2`
      console.log(`[getCMSCustomerBySlug] Published API URL: ${publishedUrl}`)

      const publishedResponse = await fetch(publishedUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
        },
      })

      if (!publishedResponse.ok) {
        console.error(
          `[getCMSCustomerBySlug] HTTP error for published version: ${publishedResponse.status}`
        )
        throw new Error(`HTTP error! status: ${publishedResponse.status}`)
      }

      const publishedData = await publishedResponse.json()
      console.log(
        `[getCMSCustomerBySlug] Published API responded with ${publishedData.docs?.length || 0} customers`
      )

      if (!publishedData.docs.length) {
        console.log(`[getCMSCustomerBySlug] No published version found either, returning null`)
        return null
      }

      console.log(`[getCMSCustomerBySlug] Found published version, returning that instead of draft`)
      return processCustomerData(publishedData.docs[0])
    }

    console.log(
      `[getCMSCustomerBySlug] Found ${preview ? 'draft' : 'published'} customer, processing data`
    )

    // If we have a customer (either draft or published), process it
    const customer = data.docs[0]

    return processCustomerData(customer)
  } catch (error) {
    console.error('Error fetching CMS customer by slug:', error)
    return null
  }
}

// Helper function to process customer data
function processCustomerData(customer: any) {
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  const formattedDate = new Date(customer.date || new Date()).toLocaleDateString('en-IN', options)
  const markdownContent = convertRichTextToMarkdown(customer.content)
  const readingTime = customer.readingTime || generateReadingTime(markdownContent)

  // Extract thumb and image URLs from the nested structure
  const thumbUrl = customer.thumb?.url ? `${PAYLOAD_URL}${customer.thumb.url}` : null
  const imageUrl = customer.image?.url ? `${PAYLOAD_URL}${customer.image.url}` : null
  const logoUrl = customer.logo?.url ? `${PAYLOAD_URL}${customer.logo.url}` : null

  // Generate TOC from content for CMS customers
  const tocResult = toc(markdownContent, {
    maxdepth: customer.toc_depth ? customer.toc_depth : 2,
  })

  return {
    slug: customer.slug,
    source: markdownContent,
    name: customer.name || 'Customer',
    title: customer.title || 'Untitled customer',
    about: customer.about,
    date: customer.date || new Date().toISOString(),
    formattedDate,
    readingTime,
    launchweek: customer.launchweek || null,
    authors:
      customer.authors?.map((author: any) => ({
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
    toc_depth: customer.toc_depth || 2,
    thumb: thumbUrl,
    image: imageUrl,
    logo: logoUrl,
    url: `/customers/${customer.slug}`,
    path: `/customers/${customer.slug}`,
    isCMS: true,
    content: markdownContent,
    tags: customer.tags || [],
    toc: {
      content: tocResult.content,
      json: tocResult.json,
    },
  }
}

/**
 * Fetch all customers from the CMS
 */
export async function getAllCMSCustomers({
  limit,
  tags,
  currentCustomerSlug,
}: {
  limit?: number
  tags?: string[]
  currentCustomerSlug?: string
} = {}): Promise<ProcessedCustomer[]> {
  try {
    const response = await fetch(
      `${PAYLOAD_URL}/api/customers?depth=1&draft=false&where[_status][equals]=published`,
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

    let customers = data.docs
      .filter((customer: CMSCustomer) => customer.slug !== currentCustomerSlug)
      .map((customer: CMSCustomer) => {
        const options: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }
        const formattedDate = new Date(customer.date || new Date()).toLocaleDateString(
          'en-IN',
          options
        )
        const markdownContent = convertRichTextToMarkdown(customer.content)
        const readingTime = customer.readingTime || generateReadingTime(markdownContent)

        // Extract thumb and image URLs from the nested structure
        const thumbUrl = `${PAYLOAD_URL}${customer.thumb?.url}`
        const imageUrl = `${PAYLOAD_URL}${customer.image?.url}`
        const logoUrl = `${PAYLOAD_URL}${customer.logo?.url}`

        return {
          slug: customer.slug || '',
          name: customer.name || '',
          title: customer.title || '',
          description: customer.description || '',
          about: customer.about,
          date: customer.date || new Date().toISOString(),
          formattedDate,
          readingTime,
          authors:
            customer.authors?.map((author: any) => ({
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
          toc_depth: customer.toc_depth || 2,
          thumb: thumbUrl,
          image: imageUrl,
          logo: logoUrl,
          url: `/customers/${customer.slug || ''}`,
          path: `/customers/${customer.slug || ''}`,
          isCMS: true,
          tags: customer.tags || [],
          content: markdownContent,
        }
      })

    // Sort by date (newest first)
    customers = customers.sort(
      (a: ProcessedCustomer, b: ProcessedCustomer) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      customers = customers.filter((customer: ProcessedCustomer) => {
        const found = tags.some((tag) => customer.tags?.includes(tag))
        return found
      })
    }

    // Limit results if specified
    if (limit) {
      customers = customers.slice(0, limit)
    }

    return customers
  } catch (error) {
    console.error('Error fetching all CMS customers:', error)
    return []
  }
}
