import { useQuery } from '@tanstack/react-query'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// GET Logs
export const useGetLogs = (
  params: {
    iso_timestamp_start?: string
    iso_timestamp_end?: string
    sql?: string
  } = {}
) => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['logs', adapter.projectRef ?? 'local', params.sql],
    queryFn: () => {
      if (!adapter.getLogs) throw new NotSupportedError('logs')
      return adapter.getLogs({
        sql: params.sql,
        start: params.iso_timestamp_start,
        end: params.iso_timestamp_end,
      })
    },
    enabled: adapter.features.logs,
    retry: false,
  })
}
