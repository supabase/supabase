import { NextRequest, NextResponse } from 'next/server'

export interface LumaGeoAddressJson {
  city: string
  type: string
  region: string
  address: string
  country: string
  latitude: string
  place_id: string
  longitude: string
  city_state: string
  description: string
  full_address: string
}

export interface LumaEvent {
  api_id: string
  calendar_api_id: string
  cover_url: string
  created_at: string
  name: string
  description: string
  description_md: string
  start_at: string
  end_at: string
  duration_interval: string
  timezone: string
  full_address: string
  geo_address_json: LumaGeoAddressJson
  url: string
  user_api_id: string
  visibility: string
  meeting_url: string | null
  zoom_meeting_url: string | null
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

    // Fetch events from Luma API
    const response = await fetch('https://public-api.lu.ma/public/v1/calendar/list-events', {
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

    // Filter and transform the events for launch week
    const launchWeekEvents = data.entries
      .filter(({ event }) => {
        // Filter for events related to launch week or Supabase meetups
        const name = event.name.toLowerCase()
        const description = event.description?.toLowerCase() || ''

        return (
          name.includes('launch week') ||
          name.includes('supabase') ||
          description.includes('launch week') ||
          description.includes('supabase')
        )
      })
      .map(({ event }: { event: LumaEvent }) => event)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

    return NextResponse.json({
      success: true,
      events: launchWeekEvents,
      total: launchWeekEvents.length,
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
