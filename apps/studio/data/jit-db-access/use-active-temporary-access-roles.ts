import { useEffect, useMemo, useState } from 'react'

import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  getActiveTemporaryAccessRoles,
  getNextTemporaryAccessExpirySeconds,
} from '@/data/jit-db-access/jit-db-access-roles.utils'
import { useJitDbAccessSelfQuery } from '@/data/jit-db-access/jit-db-access-self-query'

function readNowSeconds() {
  return Math.floor(Date.now() / 1000)
}

export function useActiveTemporaryAccessRoles(
  projectRef: string | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const isJitEnabled = useIsJitDbAccessEnabled()
  const { data, isPending, isError } = useJitDbAccessSelfQuery(
    { projectRef },
    { enabled: enabled && isJitEnabled }
  )
  const [nowSeconds, setNowSeconds] = useState(readNowSeconds)

  useEffect(() => {
    if (!enabled || !isJitEnabled || isError) return

    const now = readNowSeconds()
    if (now !== nowSeconds) {
      setNowSeconds(now)
      return
    }

    const nextExpiry = getNextTemporaryAccessExpirySeconds(data, nowSeconds)
    if (nextExpiry == null) return

    const timeout = window.setTimeout(
      () => setNowSeconds(readNowSeconds()),
      Math.max(0, nextExpiry * 1000 - Date.now())
    )
    return () => window.clearTimeout(timeout)
  }, [data, enabled, isError, isJitEnabled, nowSeconds])

  const activeRoles = useMemo(() => {
    if (!isJitEnabled || isError) return []
    return getActiveTemporaryAccessRoles(data, nowSeconds)
  }, [data, isError, isJitEnabled, nowSeconds])

  return {
    activeRoles,
    isPending: Boolean(isJitEnabled && isPending),
    isJitEnabled,
  }
}
