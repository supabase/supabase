import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'

import type { components } from 'data/api'
import type { ResponseError } from 'types'
import { notificationKeys } from './keys'
import { createInfiniteQuery } from 'react-query-kit'

const NOTIFICATIONS_PAGE_LIMIT = 10

export type NotificationsVariables = {
  status?: 'new' | 'seen' | 'archived'
  filters: {
    priority: readonly string[]
    organizations: readonly string[]
    projects: readonly string[]
  }
}

export type Notification = components['schemas']['NotificationResponseV2']

/**
 * Notification Data - This is not typed from the API end as it's meant to be open-ended
 * @param title: Title of the notification
 * @param message: Rendered as Markdown to support inline links. Should be capped to n characters
 * @param project_id: (Optional) Only available if notification is specifically for a project (e.g exhaustion notification)
 * @param actions: (Optional) Any sort of actions that we want to provide users, could be external link, could be something that needs to be handled on FE
 */
export type NotificationData = {
  title: string
  message: string
  org_slug?: string
  project_ref?: string
  actions: { label: string; url?: string; action_type?: string }[]
}

export async function getNotifications(
  options: NotificationsVariables,
  { pageParam, signal }: { pageParam: number; signal: AbortSignal }
) {
  const { status, filters } = options
  const { data, error } = await get('/platform/notifications', {
    params: {
      // @ts-expect-error maybe the types from the API aren't quite right?
      query: {
        offset: String(pageParam * NOTIFICATIONS_PAGE_LIMIT),
        limit: String(NOTIFICATIONS_PAGE_LIMIT),
        ...(status !== undefined ? { status } : { status: ['new', 'seen'] }),
        ...(filters.priority.length > 0 ? { priority: filters.priority } : {}),
        ...(filters.organizations.length > 0 ? { org_slug: filters.organizations } : {}),
        ...(filters.projects.length > 0 ? { project_ref: filters.projects } : {}),
      },
    },
    headers: { Version: '2' },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type NotificationsData = Awaited<ReturnType<typeof getNotifications>>
export type NotificationsError = ResponseError

export const useNotificationsV2Query = createInfiniteQuery<
  NotificationsData,
  NotificationsVariables,
  NotificationsError
>({
  queryKey: ['notifications'],
  fetcher: getNotifications,
  initialPageParam: 0,
  getNextPageParam(lastPage, pages, sp) {
    const page = pages.length
    if ((lastPage ?? []).length < NOTIFICATIONS_PAGE_LIMIT) return undefined
    return page
  },
})
