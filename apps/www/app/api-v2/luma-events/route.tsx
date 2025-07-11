import { NextRequest, NextResponse } from 'next/server'

export interface LumaEvent {
  api_id: string
  calendar_api_id: string
  name: string
  description: string
  start_at: string
  end_at: string
  timezone: string
  city: string
  country: string
  url: string
  visibility: string
}

interface LumaResponse {
  entries: { event: LumaEvent }[]
  has_more: boolean
  next_cursor?: string
}

export async function GET(request: NextRequest) {
  try {
    const lumaApiKey = process.env.LUMA_API_KEY

    if (!lumaApiKey) {
      console.error('LUMA_API_KEY environment variable is not set')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    // Extract query parameters from the request
    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after')
    const before = searchParams.get('before')

    // Build the Luma API URL with query parameters
    const lumaUrl = new URL('https://public-api.lu.ma/public/v1/calendar/list-events')

    if (after) {
      lumaUrl.searchParams.append('after', after)
    }
    if (before) {
      lumaUrl.searchParams.append('before', before)
    }

    // Fetch events from Luma API
    const response = await fetch(lumaUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-luma-api-key': lumaApiKey,
      },
    })

    if (!response.ok) {
      console.error('Luma API error:', response.status, response.statusText)
      return NextResponse.json(
        {
          error: 'Failed to fetch events from Luma',
          status: response.status,
        },
        { status: response.status }
      )
    }

    const data: LumaResponse = await response.json()

    const launchWeekEvents = data.entries
      .filter(({ event }: { event: LumaEvent }) => event.visibility === 'public')
      .map(({ event }: { event: LumaEvent }) => ({
        start_at: event.start_at,
        end_at: event.end_at,
        name: event.name,
        city: event.city,
        country: event.country,
        url: event.url,
        timezone: event.timezone,
      }))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

    return NextResponse.json({
      success: true,
      events: launchWeekEvents,
      total: launchWeekEvents.length,
      filters: {
        after,
        before,
      },
    })
  } catch (error) {
    console.error('Error fetching meetups from Luma:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
