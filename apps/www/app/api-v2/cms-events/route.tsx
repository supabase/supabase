import { NextRequest, NextResponse } from 'next/server'
import { CMS_SITE_ORIGIN } from '~/lib/constants'

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = CMS_SITE_ORIGIN || 'http://localhost:3030'
    const apiKey = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

    const url = new URL('/api/events', baseUrl)
    url.searchParams.set('depth', '1')
    url.searchParams.set('draft', 'false')
    url.searchParams.set('limit', '100')
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
          error: 'Failed to fetch events from CMS',
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

    const events = Array.isArray(data?.docs)
      ? data.docs
          .filter((e: any) => !!e?.slug)
          .map((e: any) => {
            const thumbUrl = e?.thumb?.url ? `${baseUrl}${e.thumb.url}` : ''
            const imageUrl = e?.image?.url ? `${baseUrl}${e.image.url}` : ''
            return {
              type: 'event',
              slug: e.slug,
              title: e.title || '',
              description: e.description || '',
              date: e.date || e.createdAt || new Date().toISOString(),
              formattedDate: e.formattedDate,
              thumb: thumbUrl || imageUrl || '',
              path: `/events/${e.slug}`,
              url: `/events/${e.slug}`,
              tags: e.tags || [],
              categories: e.categories || [],
              timezone: e.timezone || 'America/Los_Angeles',
              isCMS: true,
            }
          })
      : []

    return NextResponse.json({ success: true, events, total: events.length })
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
