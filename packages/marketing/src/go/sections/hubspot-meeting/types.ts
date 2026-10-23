/** Types for HubSpot Scheduler API responses (proxied through our API routes) */

export interface BookingInfo {
  linkId: string
  linkType: string
  isOffline: boolean
  customParams: {
    formFields: FormField[]
    allowsGuests: boolean
    meetingBufferTime: number
    availableDurations: number[] // milliseconds
  }
  availabilityByDay: Record<string, DayAvailability>
  allUsersBusyTimes: BusyTime[]
  linkAvailability: Record<string, TimeSlot[]> // keyed by duration in ms
  branding?: {
    logo?: string
    companyName?: string
    primaryColor?: string
  }
}

export interface FormField {
  name: string
  label: string
  required: boolean
  fieldType: string
}

export interface DayAvailability {
  startMinutes: number
  endMinutes: number
}

export interface BusyTime {
  startMillisUtc: number
  endMillisUtc: number
}

export interface TimeSlot {
  startMillisUtc: number
  endMillisUtc: number
}

export interface BookingRequest {
  slug: string
  firstName: string
  lastName: string
  email: string
  startTime: number // milliseconds
  duration: number // milliseconds
  timezone: string
  locale: string
  guestEmails?: string[]
}

export interface BookingConfirmation {
  calendarEventId: string
  start: string
  end: string
  duration: number
  contactId: string
  bookingTimezone: string
  locale: string
  guestEmails: string[]
  subject: string
  location?: string
  isOffline: boolean
}

export type SchedulerStep =
  | 'loading'
  | 'date-select'
  | 'time-select'
  | 'form'
  | 'submitting'
  | 'confirmed'
  | 'error'
