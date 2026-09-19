import { NOISY_EVENT_PATHNAMES, type UserActivityEvent } from './UserActivity.constants'

/** Matches the `<method> | <status> | <url> | <caller>` shape of edge/PostgREST log messages. */
const REST_LOG_PATTERN = /^(\w+)\s*\|\s*(\d{3})\s*\|\s*(\S+)/
const REST_TABLE_PATTERN = /\/rest\/v1\/([^/?]+)/i

const describeAuthEventMessage = (eventMessage: string): string | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(eventMessage)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const { path, status, error_code, auth_event } = parsed as {
    path?: unknown
    status?: unknown
    error_code?: unknown
    auth_event?: { error_code?: unknown }
  }

  let success: string | undefined
  let failure: string | undefined

  if (path === '/signup') {
    success = 'The user signed up'
    failure = 'User failed to sign up'
  } else if (path === '/token') {
    success = 'The user renewed their session'
    failure = 'User failed to renew their session'
  } else if (path === '/logout') {
    success = 'The user logged out'
    failure = 'User failed to log out'
  } else if (path === '/recover') {
    success = 'The user requested a password reset'
    failure = 'User failed to request a password reset'
  } else if (path === '/verify') {
    success = 'The user verified their account'
    failure = 'User failed to verify their account'
  } else if (path === '/otp') {
    success = 'The user requested a one-time password'
    failure = 'User failed to request a one-time password'
  } else if (path === '/invite') {
    success = 'The user accepted an invite'
    failure = 'User failed to accept the invite'
  } else if (path === '/user') {
    success = 'The user updated their profile'
    failure = 'User failed to update their profile'
  } else {
    return null
  }

  if (typeof status === 'number' && status < 400) return success

  const errorCode = error_code ?? auth_event?.error_code
  return typeof errorCode === 'string' ? `${failure} with error ${errorCode}` : failure
}

const describeRestLogMessage = (eventMessage: string): string | null => {
  const match = REST_LOG_PATTERN.exec(eventMessage.trim())
  if (!match) return null

  const [, rawMethod, statusText, url] = match
  const tableMatch = REST_TABLE_PATTERN.exec(url)
  if (!tableMatch) return null

  const table = tableMatch[1]
  const status = Number(statusText)
  const method = rawMethod.toUpperCase()

  let success: string
  let failure: string
  let preposition: 'from' | 'in'

  if (method === 'GET' || method === 'HEAD') {
    success = 'fetched'
    failure = 'fetch'
    preposition = 'from'
  } else if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    success = 'inserted/updated'
    failure = 'insert/update'
    preposition = 'in'
  } else if (method === 'DELETE') {
    success = 'deleted'
    failure = 'delete'
    preposition = 'from'
  } else {
    return null
  }

  return status < 400
    ? `User ${success} data ${preposition} the ${table} table`
    : `User failed to ${failure} data ${preposition} the ${table} table`
}

/**
 * Translates a raw log `event_message` into a plain-English description of what the user
 * did, for the subset of auth and PostgREST events with a well-known shape. Returns null
 * when the message doesn't match a known pattern, so callers can fall back to displaying
 * the raw method/pathname.
 */
export const describeUserActivityEvent = (
  logType: string,
  eventMessage: string | undefined
): string | null => {
  if (!eventMessage) return null
  return logType === 'auth'
    ? describeAuthEventMessage(eventMessage)
    : describeRestLogMessage(eventMessage)
}

export type UserActivityTimelineItem =
  | { kind: 'event'; event: UserActivityEvent }
  | { kind: 'omitted'; id: string; events: UserActivityEvent[] }

const isNoisyEvent = (event: UserActivityEvent) =>
  event.pathname !== null && NOISY_EVENT_PATHNAMES.includes(event.pathname)

/**
 * Splits a day's events into a sequence of individual events and runs of "noisy" events (see
 * NOISY_EVENT_PATHNAMES) collapsed into a single group — even a lone occurrence is grouped, so
 * it renders as a dismissible "omitted" summary rather than as a full event card.
 */
export const groupNoisyEvents = (events: UserActivityEvent[]): UserActivityTimelineItem[] => {
  const items: UserActivityTimelineItem[] = []
  let currentRun: UserActivityEvent[] = []

  const flushRun = () => {
    if (currentRun.length === 0) return
    items.push({ kind: 'omitted', id: `omitted-${currentRun[0].id}`, events: currentRun })
    currentRun = []
  }

  for (const event of events) {
    if (isNoisyEvent(event)) {
      currentRun.push(event)
    } else {
      flushRun()
      items.push({ kind: 'event', event })
    }
  }
  flushRun()

  return items
}
