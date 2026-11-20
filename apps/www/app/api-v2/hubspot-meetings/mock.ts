/**
 * Mock data for local development when HUBSPOT_MEETINGS_TOKEN is not set.
 * Only used when NEXT_PUBLIC_VERCEL_ENV !== 'production'.
 */

const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

export function shouldUseMock(): boolean {
  return !process.env.HUBSPOT_MEETINGS_TOKEN && !IS_PROD
}

/** Generate mock time slots for the next 30 days, excluding weekends */
function generateMockSlots(
  timezone: string,
  monthOffset: number
): Record<string, Array<{ startMillisUtc: number; endMillisUtc: number }>> {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()

  const DURATION_30_MIN = 1800000
  const slots: Array<{ startMillisUtc: number; endMillisUtc: number }> = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(target.getFullYear(), target.getMonth(), d)
    const dayOfWeek = date.getDay()

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    // Skip past dates
    if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue

    // Add slots from 9am to 5pm in 30-min increments
    for (let hour = 9; hour < 17; hour++) {
      for (const min of [0, 30]) {
        const slotDate = new Date(date)
        slotDate.setHours(hour, min, 0, 0)
        slots.push({
          startMillisUtc: slotDate.getTime(),
          endMillisUtc: slotDate.getTime() + DURATION_30_MIN,
        })
      }
    }
  }

  return { [String(DURATION_30_MIN)]: slots }
}

export function getMockBookingInfo(timezone: string, monthOffset: number) {
  return {
    linkId: 'mock-link-id',
    linkType: 'PERSONAL_LINK',
    isOffline: false,
    customParams: {
      formFields: [
        { name: 'firstName', label: 'First name', required: true, fieldType: 'text' },
        { name: 'lastName', label: 'Last name', required: true, fieldType: 'text' },
        { name: 'email', label: 'Email', required: true, fieldType: 'email' },
      ],
      allowsGuests: false,
      meetingBufferTime: 0,
      availableDurations: [1800000], // 30 min
    },
    availabilityByDay: {},
    allUsersBusyTimes: [],
    linkAvailability: generateMockSlots(timezone, monthOffset),
    branding: {
      companyName: 'Mock Company',
    },
  }
}

export function getMockAvailability(timezone: string) {
  return getMockBookingInfo(timezone, 0)
}

export function getMockBookingConfirmation(body: {
  startTime: number
  duration: number
  timezone: string
  email: string
  firstName: string
  lastName: string
}) {
  const start = new Date(body.startTime)
  const end = new Date(body.startTime + body.duration)

  return {
    calendarEventId: 'mock-event-' + Date.now(),
    start: start.toISOString(),
    end: end.toISOString(),
    duration: body.duration,
    contactId: 'mock-contact-id',
    bookingTimezone: body.timezone,
    locale: 'en-US',
    guestEmails: [],
    subject: `Meeting with ${body.firstName} ${body.lastName}`,
    location: 'Zoom (mock)',
    isOffline: false,
  }
}
