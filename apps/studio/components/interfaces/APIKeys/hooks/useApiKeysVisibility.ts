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
 * A hook that provides visibility states for API keys UI components
 * Consolidates logic for determining access to API keys functionality
 *
 * @deprecated [Joshen] This feels unnecessary - we're mainly using this for permissions
 * checking which each component can just call useAsyncCheckPermissions directly
 */
export function useApiKeysVisibility(): ApiKeysVisibilityState {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  const { data: apiKeysData = [], isLoading: isLoadingApiKeys } = useAPIKeysQuery(
    {
      projectRef,
      reveal: false,
    },
    { enabled: canReadAPIKeys }
  )

  const newApiKeys = useMemo(
    () => apiKeysData.filter(({ type }) => type === 'publishable' || type === 'secret') ?? [],
    [apiKeysData]
  )

  // Check if there are any publishable API keys
  // we don't check for secret keys because they can be optionally deleted
  const hasApiKeys = newApiKeys.length > 0

  // Can initialize API keys when in rollout, has permissions, not loading, and no API keys yet
  const canInitApiKeys = canReadAPIKeys && !isLoadingApiKeys && !hasApiKeys

  // Disable UI for publishable keys and secrets keys if flag is not enabled OR no API keys created yet
  const shouldDisableUI = !hasApiKeys

  return {
    hasApiKeys,
    isLoading: isLoadingPermissions || (canReadAPIKeys && isLoadingApiKeys),
    canReadAPIKeys,
    canInitApiKeys,
    shouldDisableUI,
  }
}
