import { useQuery } from '@tanstack/react-query'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'

// LIST Tables (introspection — via the adapter, no raw SQL)
export const useListTables = (schemas?: string[]) => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['tables', adapter.projectRef ?? 'local', schemas],
    queryFn: () => adapter.listTables(schemas),
    enabled: adapter.features.introspection,
  })
}
