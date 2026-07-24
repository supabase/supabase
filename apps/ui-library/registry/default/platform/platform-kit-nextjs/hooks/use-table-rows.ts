import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'

// SELECT rows via supabase-js `.from()`
export const useTableRows = ({
  schema,
  table,
  limit = 100,
  offset = 0,
  enabled = true,
}: {
  schema?: string
  table: string
  limit?: number
  offset?: number
  enabled?: boolean
}) => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: [
      'table-rows',
      adapter.projectRef ?? 'local',
      schema ?? 'public',
      table,
      limit,
      offset,
    ],
    queryFn: () => adapter.selectRows({ schema, table, limit, offset }),
    enabled: enabled && !!table && adapter.features.tableRows,
  })
}

// UPDATE a row via supabase-js `.from().update().match()`
export const useUpdateRow = () => {
  const adapter = usePlatformAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      schema?: string
      table: string
      values: Record<string, any>
      match: Record<string, any>
    }) => adapter.updateRow(vars),
    onSuccess: (_data, vars) => {
      toast.success('Row updated.')
      queryClient.invalidateQueries({
        queryKey: [
          'table-rows',
          adapter.projectRef ?? 'local',
          vars.schema ?? 'public',
          vars.table,
        ],
      })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'There was a problem updating the row.')
    },
  })
}
