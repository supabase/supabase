import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'

import { get } from '@/data/fetchers'

dayjs.extend(utc)

export type DdlLogEntry = {
  id: string
  timestamp: number
  event_message: string
  command_tag: string
  db_user: string
}

interface UseProjectDdlLogsOptions {
  projectRef?: string
  commandTags: string[]
  lookbackDays?: number
  limit?: number
  enabled?: boolean
}

export function useProjectDdlLogs({
  projectRef,
  commandTags,
  lookbackDays = 7,
  limit = 10,
  enabled = true,
}: UseProjectDdlLogsOptions) {
  const { isoStart, isoEnd } = useMemo(() => {
    const now = dayjs().utc().set('millisecond', 0)
    return {
      isoStart: now.subtract(lookbackDays, 'day').toISOString(),
      isoEnd: now.toISOString(),
    }
  }, [lookbackDays])

  // Build a safe IN list from the known-internal commandTags array
  const tagList = commandTags.map((t) => `'${t}'`).join(', ')

  const sql = [
    'select',
    '  id,',
    '  timestamp,',
    '  event_message,',
    '  metadata[0].parsed[0].command_tag as command_tag,',
    '  metadata[0].parsed[0].user_name as db_user',
    'from postgres_logs',
    `where metadata[0].parsed[0].command_tag IN (${tagList})`,
    'order by timestamp desc',
    `limit ${limit}`,
  ].join('\n')

  const {
    data,
    isPending: isLoading,
    refetch,
  } = useQuery({
    queryKey: ['project-ddl-logs', projectRef, tagList, isoStart, isoEnd, limit],
    queryFn: async ({ signal }) => {
      const { data, error } = await get('/platform/projects/{ref}/analytics/endpoints/logs.all', {
        params: {
          path: { ref: projectRef! },
          query: { sql, iso_timestamp_start: isoStart, iso_timestamp_end: isoEnd },
        },
        signal,
      })
      if (error) throw error
      return data as unknown as { result: Record<string, unknown>[] }
    },
    enabled: IS_PLATFORM && enabled && Boolean(projectRef) && commandTags.length > 0,
    refetchOnWindowFocus: false,
  })

  const logs: DdlLogEntry[] = (data?.result ?? []).map((row) => ({
    id: String(row.id ?? ''),
    timestamp: Number(row.timestamp ?? 0),
    event_message: String(row.event_message ?? ''),
    command_tag: String(row.command_tag ?? ''),
    db_user: String(row.db_user ?? ''),
  }))

  return { logs, isLoading: IS_PLATFORM && enabled ? isLoading : false, refetch }
}
