import { NextRequest, NextResponse } from 'next/server'

import { getMockBookingConfirmation, shouldUseMock } from '../mock'

const HUBSPOT_BASE = 'https://api.hubspot.com/scheduler/v3/meetings/meeting-links/book'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (shouldUseMock()) {
    return NextResponse.json(getMockBookingConfirmation(body))
  }

  const token = process.env.HUBSPOT_MEETINGS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'HubSpot token not configured' }, { status: 500 })
  }

  const timezone = body.timezone || 'America/New_York'
  const url = `${HUBSPOT_BASE}?timezone=${encodeURIComponent(timezone)}`

  // Transform into HubSpot's expected format
  // startTime must be ISO 8601, formFields is required (can be empty)
  const hubspotBody = {
    slug: body.slug,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    startTime: new Date(body.startTime).toISOString(),
    duration: body.duration,
    timezone,
    locale: body.locale || 'en-us',
    formFields: body.formFields ?? [],
    likelyAvailableUserIds: body.likelyAvailableUserIds ?? [],
    legalConsentResponses: body.legalConsentResponses ?? [],
    ...(body.guestEmails?.length ? { guestEmails: body.guestEmails } : {}),
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hubspotBody),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[HubSpot booking error]', { status: res.status, body: text })
    return NextResponse.json(
      { error: 'Booking failed. Please try again or contact support.' },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}
