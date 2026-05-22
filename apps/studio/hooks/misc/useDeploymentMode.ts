import { useMemo } from 'react'

import { useDeploymentModeQuery } from '@/data/config/deployment-mode-query'
import { IS_PLATFORM } from '@/lib/constants'

export type DeploymentMode = {
  isPlatform: boolean
  isCli: boolean
  isSelfHosted: boolean
}

/**
 * Resolves the current Studio deployment mode (platform / CLI / self-hosted).
 *
 * `isPlatform` is the build-time `IS_PLATFORM` constant — prefer that constant
 * directly when you only need the platform-vs-not split (build-time, server-
 * side, or module-scope). Reach for this hook when you need to distinguish
 * CLI from self-hosted at runtime, which is something `IS_PLATFORM` can't
 * express on its own.
 *
 * CLI vs self-hosted is resolved server-side by /platform/deployment-mode
 * (reading `CURRENT_CLI_VERSION`). The underlying query is disabled on
 * platform builds, so the hook is a no-op there.
 *
 * The return is memoized on the primitive flags so consumers can safely list
 * the whole `DeploymentMode` object in their `useMemo`/`useCallback` deps.
 */
export function useDeploymentMode(): DeploymentMode {
  const { data } = useDeploymentModeQuery()
  const isCli = !IS_PLATFORM && (data?.is_cli_mode ?? false)
  const isSelfHosted = !IS_PLATFORM && !isCli
  return useMemo(() => ({ isPlatform: IS_PLATFORM, isCli, isSelfHosted }), [isCli, isSelfHosted])
}
