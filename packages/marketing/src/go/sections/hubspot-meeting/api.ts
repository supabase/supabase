import type { BookingConfirmation, BookingInfo, BookingRequest } from './types'

const BASE = '/api-v2/hubspot-meetings'

async function parseErrorResponse(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body.error || body.message || fallback
  } catch {
    return fallback
  }
}

function wrapNetworkError(err: unknown): never {
  if (
    err instanceof TypeError &&
    (err.message === 'Failed to fetch' || err.message === 'Load failed')
  ) {
    throw new Error('Unable to connect. Please check your internet connection and try again.')
  }
  throw err
}

export async function fetchBookingInfo(
  slug: string,
  timezone: string,
  monthOffset = 0
): Promise<BookingInfo> {
  const params = new URLSearchParams({ timezone, monthOffset: String(monthOffset) })
  let res: Response
  try {
    res = await fetch(`${BASE}/${encodeURIComponent(slug)}?${params}`)
  } catch (err) {
    wrapNetworkError(err)
  }
  if (!res.ok) {
    if (res.status === 404) throw new Error('This meeting calendar could not be found.')
    throw new Error(await parseErrorResponse(res, `Failed to load calendar (${res.status})`))
  }
  return res.json()
}

export async function fetchAvailability(slug: string, timezone: string): Promise<BookingInfo> {
  const params = new URLSearchParams({ timezone })
  let res: Response
  try {
    res = await fetch(`${BASE}/${encodeURIComponent(slug)}/availability?${params}`)
  } catch (err) {
    wrapNetworkError(err)
  }
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, `Failed to load availability (${res.status})`))
  }
  return res.json()
}

export async function bookMeeting(request: BookingRequest): Promise<BookingConfirmation> {
  let res: Response
  try {
    res = await fetch(`${BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (err) {
    wrapNetworkError(err)
  }
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, `Booking failed (${res.status})`))
  }
  return res.json()
}
