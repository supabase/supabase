import * as Sentry from '@sentry/nextjs'
import { DEFAULT_META_DESCRIPTION } from '~/lib/constants'
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
export interface LumaPayloadEvent {
  api_id: string
  calendar_api_id: string
  name: string
  description: string
  start_at: string
  end_at: string
  timezone: string
  url: string
  cover_url: string
  visibility: string
  geo_address_json: LumaGeoAddressJson
  hosts: LumaHost[]
}
export interface LumaEvent {
  id: string
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

export interface LumaHost {
  id: string
  name: string
  email: string
  first_name: string
  last_name: string
  avatar_url: string
}

interface LumaResponse {
  entries: { event: LumaPayloadEvent }[]
  has_more: boolean
  next_cursor?: string
}

export type LumaCalendar = 'community' | 'hackathon'

async function fetchLumaCalendar(
  apiKey: string,
  calendar: LumaCalendar,
  after: string | null,
  before: string | null
) {
  const lumaUrl = new URL('https://public-api.lu.ma/public/v1/calendar/list-events')
  if (after) lumaUrl.searchParams.append('after', after)
  if (before) lumaUrl.searchParams.append('before', before)

  const response = await fetch(lumaUrl.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-luma-api-key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Luma API error (${calendar}): ${response.status} ${response.statusText}`)
  }

  const data: LumaResponse = await response.json()

  return data.entries
    .filter(({ event }) => event.visibility === 'public')
    .map(({ event }) => ({
      id: event.api_id,
      calendar,
      start_at: event.start_at,
      end_at: event.end_at,
      name: event.name,
      city: event.geo_address_json?.city,
      country: event.geo_address_json?.country,
      url: event.url,
      timezone: event.timezone,
      cover_url: event.cover_url,
      description: event.description,
      hosts: event.hosts || [],
    }))
}

export async function GET(request: NextRequest) {
  try {
    const communityKey = process.env.LUMA_API_KEY
    const hackathonKey = process.env.LUMA_HACKATHONS_API_KEY

    if (!communityKey && !hackathonKey) {
      console.error('No Luma API keys configured (LUMA_API_KEY / LUMA_HACKATHONS_API_KEY)')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after')
    const before = searchParams.get('before')

    const calendarFetches: Array<Promise<Awaited<ReturnType<typeof fetchLumaCalendar>>>> = []
    if (communityKey)
      calendarFetches.push(fetchLumaCalendar(communityKey, 'community', after, before))
    if (hackathonKey)
      calendarFetches.push(fetchLumaCalendar(hackathonKey, 'hackathon', after, before))

    const results = await Promise.allSettled(calendarFetches)

    const events = results
      .flatMap((result) => {
        if (result.status === 'fulfilled') return result.value
        Sentry.captureException(result.reason)
        console.error(result.reason)
        return []
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
      filters: { after, before },
    })
  } catch (error) {
    Sentry.captureException(error)
    console.error('Error fetching events from Luma:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
