import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// GET Secrets
export const useGetSecrets = () => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['secrets', adapter.projectRef ?? 'local'],
    queryFn: () => {
      if (!adapter.getSecrets) throw new NotSupportedError('secrets')
      return adapter.getSecrets()
    },
    enabled: adapter.features.secrets,
    retry: false,
  })
}

// CREATE Secrets
export const useCreateSecrets = () => {
  const adapter = usePlatformAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (secrets: { name: string; value: string }[]) => {
      if (!adapter.createSecrets) throw new NotSupportedError('secrets')
      return adapter.createSecrets(secrets)
    },
    onSuccess: () => {
      toast.success('Secrets created successfully.')
      queryClient.refetchQueries({ queryKey: ['secrets', adapter.projectRef ?? 'local'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'There was a problem with your request.')
    },
  })
}

// DELETE Secrets
export const useDeleteSecrets = () => {
  const adapter = usePlatformAdapter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (secretNames: string[]) => {
      if (!adapter.deleteSecrets) throw new NotSupportedError('secrets')
      return adapter.deleteSecrets(secretNames)
    },
    onSuccess: () => {
      toast.success('Secrets deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['secrets', adapter.projectRef ?? 'local'] })
    },
    onError: (error: any) => {
      toast.error(error?.message || 'There was a problem with your request.')
    },
  })
}
