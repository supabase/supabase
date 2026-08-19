import { useMemo } from 'react'

import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getActiveTemporaryAccessRoles } from '@/data/jit-db-access/jit-db-access-roles.utils'
import { useJitDbAccessSelfQuery } from '@/data/jit-db-access/jit-db-access-self-query'

export function useActiveTemporaryAccessRoles(
  projectRef: string | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const isJitEnabled = useIsJitDbAccessEnabled()
  const { data, isPending, isError } = useJitDbAccessSelfQuery(
    { projectRef },
    { enabled: enabled && isJitEnabled }
  )

  const activeRoles = useMemo(() => {
    if (!isJitEnabled || isError) return []
    return getActiveTemporaryAccessRoles(data, Math.floor(Date.now() / 1000))
  }, [data, isError, isJitEnabled])

  return {
    activeRoles,
    isPending: Boolean(isJitEnabled && isPending),
    isJitEnabled,
  }
}
