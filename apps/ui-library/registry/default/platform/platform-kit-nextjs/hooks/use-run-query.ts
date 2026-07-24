import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// RUN SQL Query (optional capability — only available when the adapter can
// execute arbitrary SQL, e.g. classic Supabase with a Management transport).
export const useRunQuery = () => {
  const adapter = usePlatformAdapter()
  return useMutation({
    mutationFn: async ({ query, readOnly }: { query: string; readOnly?: boolean }) => {
      if (!adapter.runSql) throw new NotSupportedError('runSql')
      return adapter.runSql({ query, readOnly })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'There was a problem with your query.')
    },
  })
}
