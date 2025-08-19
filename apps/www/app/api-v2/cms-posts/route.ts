import { NextRequest, NextResponse } from 'next/server'
import { CMS_SITE_ORIGIN } from '~/lib/constants'
import { generateReadingTime } from '~/lib/helpers'

// Lightweight runtime for better performance
export const runtime = 'edge'

// Minimal rich-text to plain text for reading time
function richTextToPlainText(content: any): string {
  try {
    const blocks = content?.root?.children
    if (!Array.isArray(blocks)) return ''
    const segments: string[] = []
    for (const node of blocks) {
      if (node?.type === 'heading') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      } else if (node?.type === 'paragraph') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      } else if (node?.type === 'list') {
        const items = Array.isArray(node.children)
          ? node.children
              .map((item: any) =>
                Array.isArray(item?.children)
                  ? item.children.map((c: any) => c?.text || '').join('')
                  : ''
              )
              .filter(Boolean)
          : []
        if (items.length > 0) segments.push(items.join(' '))
      } else if (node?.type === 'link') {
        const text = Array.isArray(node.children)
          ? node.children.map((c: any) => c?.text || '').join('')
          : ''
        if (text) segments.push(text)
      }
    }
    return segments.join('\n')
  } catch {
    return ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'preview' // 'preview' or 'full'
    const limit = searchParams.get('limit') || '100'
    const slug = searchParams.get('slug') // For fetching specific post

    const baseUrl = CMS_SITE_ORIGIN
    const apiKey = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

    const url = new URL('/api/posts', baseUrl)
    url.searchParams.set('depth', '2')
    url.searchParams.set('draft', 'false')
    url.searchParams.set('limit', limit)
    url.searchParams.set('where[_status][equals]', 'published')

    // If fetching specific post by slug
    if (slug) {
      url.searchParams.set('where[slug][equals]', slug)
      url.searchParams.set('limit', '1')
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // Add cache with revalidation for better performance
      next: {
        revalidate: 300, // 5 minutes cache
      },
    })

    if (!response.ok) {
      console.error('[cms-posts] Non-OK response:', response.status, response.statusText)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch posts from CMS',
          status: response.status,
        },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      console.error('[cms-posts] Non-JSON response, content-type:', contentType)
      return NextResponse.json(
        {
          success: false,
          error: 'CMS returned non-JSON response',
          contentType,
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    const docs = Array.isArray(data?.docs) ? data.docs : []

    const dateFmt: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const posts = docs
      .filter((p: any) => !!p?.slug)
      .map((p: any) => {
        const thumbUrl = p?.thumb?.url
          ? typeof p.thumb.url === 'string' && p.thumb.url.includes('http')
            ? p.thumb.url
            : `${baseUrl}${p.thumb.url}`
          : ''
        const imageUrl = p?.image?.url
          ? typeof p.image.url === 'string' && p.image.url.includes('http')
            ? p.image.url
            : `${baseUrl}${p.image.url}`
          : ''
        const date = p.date || p.createdAt || new Date().toISOString()
        const formattedDate = new Date(date).toLocaleDateString('en-IN', dateFmt)
        const plain = richTextToPlainText(p?.content)
        const readingTime = generateReadingTime(plain)

        const authors = Array.isArray(p?.authors)
          ? p.authors.map((a: any) => ({
              author: a?.author || 'Unknown Author',
              author_id: a?.author_id || '',
              position: a?.position || '',
              author_url: a?.author_url || '#',
              author_image_url: a?.author_image_url?.url
                ? typeof a.author_image_url.url === 'string' &&
                  a.author_image_url.url.includes('http')
                  ? a.author_image_url.url
                  : `${baseUrl}${a.author_image_url.url}`
                : null,
              username: a?.username || '',
            }))
          : []

        // Base post structure (always included)
        const basePost = {
          type: 'blog' as const,
          slug: p.slug,
          title: p.title || '',
          description: p.description || '',
          date,
          formattedDate,
          readingTime,
          authors,
          thumb: thumbUrl || imageUrl || '',
          image: imageUrl || undefined,
          url: `/blog/${p.slug}`,
          path: `/blog/${p.slug}`,
          tags: p.tags || [],
          categories: [],
          isCMS: true,
        }

        // Add content for full mode
        if (mode === 'full') {
          return {
            ...basePost,
            content: p.content, // Include full content for individual post fetches
          }
        }

        return basePost
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // For single post requests, return the post directly
    if (slug && posts.length > 0) {
      return NextResponse.json({
        success: true,
        post: posts[0],
        mode,
      })
    }

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
      mode,
      cached: true,
    })
  } catch (error) {
    console.error('[cms-posts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
