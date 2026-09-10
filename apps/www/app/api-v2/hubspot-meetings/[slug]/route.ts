import { NextRequest, NextResponse } from 'next/server'

import { getMockBookingInfo, shouldUseMock } from '../mock'

const HUBSPOT_BASE = 'https://api.hubspot.com/scheduler/v3/meetings/meeting-links/book'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { searchParams } = new URL(request.url)
  const timezone = searchParams.get('timezone') || 'America/New_York'
  const monthOffset = parseInt(searchParams.get('monthOffset') || '0', 10)

  if (shouldUseMock()) {
    return NextResponse.json(getMockBookingInfo(timezone, monthOffset))
  }

  const token = process.env.HUBSPOT_MEETINGS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'HubSpot token not configured' }, { status: 500 })
  }

  const { slug } = await params
  const url = `${HUBSPOT_BASE}/${encodeURIComponent(slug)}?timezone=${encodeURIComponent(timezone)}&monthOffset=${encodeURIComponent(String(monthOffset))}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'HubSpot API error', detail: text }, { status: res.status })
  }

  const data = await res.json()

  // HubSpot returns `durations` but our types expect `availableDurations`
  if (data.customParams?.durations && !data.customParams.availableDurations) {
    data.customParams.availableDurations = data.customParams.durations
  }

  // Transform linkAvailability from HubSpot's nested structure to a flat Record<string, TimeSlot[]>
  // HubSpot returns: { linkAvailabilityByDuration: { "1800000": { availabilities: [...] } } }
  // We need:         { "1800000": [...] }
  if (data.linkAvailability?.linkAvailabilityByDuration) {
    const flat: Record<string, Array<{ startMillisUtc: number; endMillisUtc: number }>> = {}
    for (const [duration, value] of Object.entries(
      data.linkAvailability.linkAvailabilityByDuration as Record<
        string,
        { availabilities?: Array<{ startMillisUtc: number; endMillisUtc: number }> }
      >
    )) {
      flat[duration] = value.availabilities ?? []
    }
    data.linkAvailability = flat
  }

  return NextResponse.json(data)
}
