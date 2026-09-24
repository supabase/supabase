import { createLoader, createSerializer } from 'nuqs'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import type { QuerySearchParamsType } from './UnifiedLogs.types'

const serializeLogsSearch = createSerializer(SEARCH_PARAMS_PARSER)
const loadLogsSearch = createLoader(SEARCH_PARAMS_PARSER)

const USER_LOGS_WINDOW_MS = 24 * 60 * 60 * 1000

export type LogsDateRange = [Date, Date]

/** The window a user's recent activity is read from, ending now. */
export const getUserLogsRange = (nowMs: number): LogsDateRange => [
  new Date(nowMs - USER_LOGS_WINDOW_MS),
  new Date(nowMs),
]

/** List search for a user's logs within a range, with every other param at its default. */
export function getUserLogsSearch({
  userId,
  range,
}: {
  userId: string
  range: LogsDateRange
}): QuerySearchParamsType {
  const {
    uuid: _uuid,
    live: _live,
    ...search
  } = loadLogsSearch(serializeLogsSearch({ user: userId, date: range }))
  return search
}

/** Link to the logs page filtered to a user, optionally opening one of their logs. */
export function getUserLogsHref({
  projectRef,
  userId,
  range,
  logId,
}: {
  projectRef: string
  userId: string
  range: LogsDateRange
  logId?: string
}) {
  return `/project/${projectRef}/logs${serializeLogsSearch({ user: userId, date: range, id: logId ?? null })}`
}
