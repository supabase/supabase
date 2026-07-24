import { useQuery } from '@tanstack/react-query'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// LIST Users (via the adapter's auth-admin capability)
export const useListUsers = (page = 1, perPage = 100) => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['users', adapter.projectRef ?? 'local', page, perPage],
    queryFn: () => {
      if (!adapter.listUsers) throw new NotSupportedError('authUsers')
      return adapter.listUsers({ page, perPage })
    },
    enabled: adapter.features.authUsers,
    retry: false,
  })
}
