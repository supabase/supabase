import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'
import type { AuthConfig } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'

// GET Auth Config
export const useGetAuthConfig = () => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['auth-config', adapter.projectRef ?? 'local'],
    queryFn: () => {
      if (!adapter.getAuthConfig) throw new NotSupportedError('authConfig')
      return adapter.getAuthConfig()
    },
    enabled: adapter.features.authConfig,
    retry: false,
  })
}

// UPDATE Auth Config
export const useUpdateAuthConfig = () => {
  const adapter = usePlatformAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<AuthConfig>) => {
      if (!adapter.updateAuthConfig) throw new NotSupportedError('authConfig')
      return adapter.updateAuthConfig(payload)
    },
    onSuccess: () => {
      toast.success('Auth config updated.')
      queryClient.invalidateQueries({ queryKey: ['auth-config', adapter.projectRef ?? 'local'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'There was a problem with your request.')
    },
  })
}
