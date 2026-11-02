import * as Sentry from '@sentry/nextjs'
import { DEFAULT_META_DESCRIPTION } from '~/lib/constants'
import { fetchLumaCalendar } from '~/lib/events'
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

export interface LumaTag {
  api_id?: string
  name: string
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LUMA_API_KEY

    if (!apiKey) {
      console.error('No Luma API key configured (LUMA_API_KEY)')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after')
    const before = searchParams.get('before')

    const events = (await fetchLumaCalendar(apiKey, after, before)).sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )

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
