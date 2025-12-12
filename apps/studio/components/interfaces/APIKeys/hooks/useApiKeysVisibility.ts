import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { useParams } from 'common'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface ApiKeysVisibilityState {
  hasApiKeys: boolean
  isLoading: boolean
  canReadAPIKeys: boolean
  canInitApiKeys: boolean
  shouldDisableUI: boolean
}

/**
 * @deprecated [Joshen] This feels unnecessary now - we're mainly using this for permissions
 * checking which each component can just call useAsyncCheckPermissions directly
 *
 * To clean up as new API keys are available for all projects now either way
 */
export function useApiKeysVisibility(): ApiKeysVisibilityState {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  const { data: apiKeysData = [], isPending: isLoadingApiKeys } = useAPIKeysQuery(
    {
      projectRef,
      reveal: false,
    },
    { enabled: canReadAPIKeys }
  )

  const newApiKeys = useMemo(
    () => apiKeysData.filter(({ type }) => type === 'publishable' || type === 'secret'),
    [apiKeysData]
  )
  const hasNewApiKeys = newApiKeys.length > 0

  // Can initialize API keys when in rollout, has permissions, not loading, and no API keys yet
  const canInitApiKeys = canReadAPIKeys && !isLoadingApiKeys && !hasNewApiKeys

  // Disable UI for publishable keys and secrets keys if flag is not enabled OR no API keys created yet
  const shouldDisableUI = !hasNewApiKeys

  return {
    hasApiKeys: hasNewApiKeys,
    isLoading: isLoadingPermissions || (canReadAPIKeys && isLoadingApiKeys),
    canReadAPIKeys,
    canInitApiKeys,
    shouldDisableUI,
  }
}
