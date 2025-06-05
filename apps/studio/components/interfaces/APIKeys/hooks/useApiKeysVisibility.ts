import { useMemo } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'

interface ApiKeysVisibilityState {
  isInRollout: boolean
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
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')
  const isBasicApiKeysEnabled = useFlag('basicApiKeys')

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
  const canInitApiKeys = isBasicApiKeysEnabled && canReadAPIKeys && !isLoading && !hasApiKeys

  // Disable UI for publishable keys and secrets keys if flag is not enabled OR no API keys created yet
  const shouldDisableUI = !isBasicApiKeysEnabled || !hasApiKeys

  return {
    isInRollout: isBasicApiKeysEnabled,
    hasApiKeys,
    isLoading,
    canReadAPIKeys,
    canInitApiKeys,
    shouldDisableUI,
  }
}
