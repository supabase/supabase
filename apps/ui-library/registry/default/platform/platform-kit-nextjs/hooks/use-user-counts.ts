import { useQuery } from '@tanstack/react-query'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// GET User Counts by day
export const useGetUserCountsByDay = (days: number) => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['user-counts', adapter.projectRef ?? 'local', days],
    queryFn: () => {
      if (!adapter.userCountsByDay) throw new NotSupportedError('authUsers')
      return adapter.userCountsByDay(days)
    },
    enabled: adapter.features.authUsers,
    retry: false,
  })
}
