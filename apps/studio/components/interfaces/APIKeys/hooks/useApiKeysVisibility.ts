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
 */
export function useApiKeysVisibility(): ApiKeysVisibilityState {
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.READ, 'api_keys')

  const { data: apiKeysData, isLoading } = useAPIKeysQuery({
    projectRef,
    reveal: false,
  })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  // Check if there are any publishable API keys
  // we don't check for secret keys because they can be optionally deleted
  const hasApiKeys = publishableApiKeys.length > 0

  // Can initialize API keys when in rollout, has permissions, not loading, and no API keys yet
  const canInitApiKeys = canReadAPIKeys && !isLoading && !hasApiKeys

  // Disable UI for publishable keys and secrets keys if flag is not enabled OR no API keys created yet
  const shouldDisableUI = !hasApiKeys

  return {
    hasApiKeys,
    isLoading,
    canReadAPIKeys,
    canInitApiKeys,
    shouldDisableUI,
  }
}
