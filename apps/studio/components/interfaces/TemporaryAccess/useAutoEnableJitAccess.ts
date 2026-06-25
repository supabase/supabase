import { useCallback } from 'react'

import { useJitDbAccessQuery } from '@/data/jit-db-access/jit-db-access-query'
import { useJitDbAccessUpdateMutation } from '@/data/jit-db-access/jit-db-access-update-mutation'

/**
 * Ensures PAM/JIT is enabled on a project before granting access (Option B: auto-enable on first grant).
 */
export function useAutoEnableJitAccess(projectRef: string | undefined) {
  const { data: configuration } = useJitDbAccessQuery({ projectRef })
  const { mutateAsync: updateJitDbAccess } = useJitDbAccessUpdateMutation()

  const ensureEnabled = useCallback(async () => {
    if (!projectRef) throw new Error('projectRef is required')

    const isEnabled =
      configuration?.state === 'enabled' && configuration?.appliedSuccessfully !== false

    if (isEnabled) return

    if (configuration?.state === 'unavailable') {
      throw new Error('Temporary access is unavailable on this project')
    }

    await updateJitDbAccess({
      projectRef,
      requestedConfig: { state: 'enabled' },
    })
  }, [configuration, projectRef, updateJitDbAccess])

  return { ensureEnabled }
}
