import type { BadgeProps } from 'ui'

export type UserActivityService = 'PostgREST' | 'Auth' | 'Storage'

export type UserActivityHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface UserActivityEvent {
  id: string
  /** Human-readable summary of what the user did */
  title: string
  service: UserActivityService
  method: UserActivityHttpMethod
  path: string
  status: number
  durationMs: number
  /** ISO timestamp of the event */
  timestamp: string
}

export interface UserActivityUser {
  email: string
  id: string
}

/** Mocked user whose activity is being inspected. Replace with real data later. */
export const MOCK_USER: UserActivityUser = {
  email: 'pat+mrjf3ms4@supabase.io',
  id: '7e5ea3d8-80ad-40ed-82b6-ec084d30da9d',
}

/**
 * Mocked activity feed reproducing the design. Ordered chronologically within a single day.
 * Replace with a real query hook later.
 */
export const MOCK_EVENTS: UserActivityEvent[] = [
  {
    id: 'evt-1',
    title: 'User read from posts',
    service: 'PostgREST',
    method: 'GET',
    path: '/rest/v1/posts',
    status: 200,
    durationMs: 52,
    timestamp: '2026-05-14T08:32:14Z',
  },
  {
    id: 'evt-2',
    title: 'User read from posts',
    service: 'PostgREST',
    method: 'GET',
    path: '/rest/v1/posts',
    status: 200,
    durationMs: 52,
    timestamp: '2026-05-14T09:09:17Z',
  },
  {
    id: 'evt-3',
    title: 'User signed in',
    service: 'Auth',
    method: 'POST',
    path: '/auth/v1/token',
    status: 200,
    durationMs: 180,
    timestamp: '2026-05-14T09:22:01Z',
  },
  {
    id: 'evt-4',
    title: 'User signed out',
    service: 'Auth',
    method: 'POST',
    path: '/auth/v1/logout',
    status: 204,
    durationMs: 30,
    timestamp: '2026-05-14T10:56:58Z',
  },
  {
    id: 'evt-5',
    title: 'User uploaded a file',
    service: 'Storage',
    method: 'POST',
    path: '/storage/v1/object/uploads',
    status: 200,
    durationMs: 120,
    timestamp: '2026-05-14T12:02:38Z',
  },
  {
    id: 'evt-6',
    title: "User's insert into posts was blocked by RLS",
    service: 'PostgREST',
    method: 'POST',
    path: '/rest/v1/posts',
    status: 401,
    durationMs: 9,
    timestamp: '2026-05-14T13:23:48Z',
  },
]

/** Tailwind background class for a service's timeline dot. Kept here so it's easy to retheme. */
export const SERVICE_DOT_COLOR: Record<UserActivityService, string> = {
  PostgREST: 'bg-brand',
  Auth: 'bg-purple-900',
  Storage: 'bg-blue-900',
}

/** A request failed if its status code is 4xx or 5xx. */
export const isErrorStatus = (status: number) => status >= 400

/** Map an HTTP status code to a Badge variant. */
export const statusBadgeVariant = (status: number): BadgeProps['variant'] =>
  isErrorStatus(status) ? 'destructive' : 'success'
