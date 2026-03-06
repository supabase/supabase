import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'

import { notificationKeys } from './keys'

const NOTIFICATIONS_PAGE_LIMIT = 10

export type NotificationVariables = {
  page: number | undefined
  limit?: number
  status?: 'new' | 'seen' | 'archived'
  filters: {
    priority?: readonly string[]
    organizations?: readonly string[]
    projects?: readonly string[]
  }
}

export type Notification = components['schemas']['NotificationResponse']

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

export async function getNotifications(options: NotificationVariables, signal?: AbortSignal) {
  const { status, filters, page = 0, limit = NOTIFICATIONS_PAGE_LIMIT } = options
  const { priority = [], organizations = [], projects = [] } = filters

  const { data, error } = await get('/platform/notifications', {
    params: {
      query: {
        offset: page * limit,
        limit,
        ...(status !== undefined ? { status } : { status: ['new', 'seen'].join(',') }),
        ...(priority.length > 0 ? { priority: priority.join(',') } : {}),
        ...(organizations.length > 0 ? { org_slug: organizations.join(',') } : {}),
        ...(projects.length > 0 ? { project_ref: projects.join(',') } : {}),
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

export const useNotificationsV2Query = <TData = NotificationsData>(
  { status, filters, limit = NOTIFICATIONS_PAGE_LIMIT }: Omit<NotificationVariables, 'page'>,
  {
    enabled,
    ...options
  }: UseCustomInfiniteQueryOptions<
    NotificationsData,
    NotificationsError,
    InfiniteData<TData>,
    readonly unknown[],
    number | undefined
  > = {}
) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.listV2({ status, filters, limit }),
    queryFn: ({ signal, pageParam }) =>
      getNotifications({ status, filters, limit, page: pageParam }, signal),
    enabled: enabled,
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      if ((lastPage ?? []).length < limit) return undefined
      return page
    },
    ...options,
  })
}
