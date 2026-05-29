import { NextRequest, NextResponse } from 'next/server'

import { getMockAvailability, shouldUseMock } from '../../mock'

const HUBSPOT_BASE =
  'https://api.hubspot.com/scheduler/v3/meetings/meeting-links/book/availability-page'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { searchParams } = new URL(request.url)
  const timezone = searchParams.get('timezone') || 'America/New_York'

  if (shouldUseMock()) {
    return NextResponse.json(getMockAvailability(timezone))
  }

  const token = process.env.HUBSPOT_MEETINGS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'HubSpot token not configured' }, { status: 500 })
  }

  const { slug } = await params
  const url = `${HUBSPOT_BASE}/${encodeURIComponent(slug)}?timezone=${encodeURIComponent(timezone)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'HubSpot API error', detail: text }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
