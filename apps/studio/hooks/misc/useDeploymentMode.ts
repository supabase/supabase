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
  // Default to CLI (`?? true`) during the loading window. `'direct'` is the only
  // method valid in every environment, so a self-hosted user briefly seeing CLI
  // defaults lands on a valid (if not preferred) choice — whereas a CLI user
  // briefly seeing self-hosted defaults gets `connectionMethod` pinned to
  // `'session'`, which isn't a valid CLI method.
  const isCli = !IS_PLATFORM && (data?.is_cli_mode ?? true)
  const isSelfHosted = !IS_PLATFORM && !isCli
  return useMemo(() => ({ isPlatform: IS_PLATFORM, isCli, isSelfHosted }), [isCli, isSelfHosted])
}
