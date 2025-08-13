import { NextRequest, NextResponse } from 'next/server'
import { CMS_SITE_ORIGIN } from '~/lib/constants'
import { generateReadingTime } from '~/lib/helpers'

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

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = CMS_SITE_ORIGIN || 'http://localhost:3030'
    const apiKey = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

    const url = new URL('/api/posts', baseUrl)
    url.searchParams.set('depth', '2')
    url.searchParams.set('draft', 'false')
    url.searchParams.set('limit', '200')
    url.searchParams.set('where[_status][equals]', 'published')

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch posts from CMS',
          status: response.status,
          body: body.slice(0, 200),
        },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      const body = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: 'CMS returned non-JSON response',
          contentType,
          body: body.slice(0, 200),
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
        const thumbUrl = p?.thumb?.url ? `${baseUrl}${p.thumb.url}` : ''
        const imageUrl = p?.image?.url ? `${baseUrl}${p.image.url}` : ''
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
                ? a.author_image_url.url.includes('http')
                  ? a.author_image_url.url
                  : `${baseUrl}${a.author_image_url.url}`
                : null,
              username: a?.username || '',
            }))
          : []

        return {
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
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, posts, total: posts.length })
  } catch (error) {
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
