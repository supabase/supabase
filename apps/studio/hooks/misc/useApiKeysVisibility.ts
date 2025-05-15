import { useMemo } from 'react'
import { useParams } from 'common'
import { useFlag } from 'hooks/ui/useFlag'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface ApiKeysVisibilityState {
  isInRollout: boolean
  hasPublishableKeys: boolean
  hasNoPublishableKeys: boolean
  isLoading: boolean
  canReadAPIKeys: boolean
  isComingSoon: boolean
  shouldDisableUI: boolean
  showCreateButton: boolean
  showRolloutCallout: boolean
}

/**
 * A hook that provides visibility states for API keys UI components
 * Consolidates logic for determining whether to show the coming soon banner,
 * create button, or fade out the UI
 */
export function useApiKeysVisibility(): ApiKeysVisibilityState {
  const { ref: projectRef } = useParams()
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')
  const newApiKeysRollout = useFlag('newApiKeysRollout')

  const { data: apiKeysData, isLoading } = useAPIKeysQuery({
    projectRef,
    reveal: false,
  })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  const hasPublishableKeys = publishableApiKeys.length > 0
  const hasNoPublishableKeys = publishableApiKeys.length === 0 && !isLoading

  // Only show "coming soon" if NOT in rollout
  const isComingSoon = !newApiKeysRollout

  // Disable and fade the UI when:
  // 1. Not in the rollout OR
  // 2. In the rollout but has no publishable keys yet
  const shouldDisableUI = !newApiKeysRollout || hasNoPublishableKeys

  // Show create button only when in rollout, has permissions, not loading, and no publishable keys
  const showCreateButton = newApiKeysRollout && canReadAPIKeys && !isLoading && hasNoPublishableKeys

  // Show rollout callout when in rollout, has permissions, not loading, and has publishable keys
  const showRolloutCallout = newApiKeysRollout && canReadAPIKeys && !isLoading && hasPublishableKeys

  return {
    isInRollout: !!newApiKeysRollout,
    hasPublishableKeys,
    hasNoPublishableKeys,
    isLoading,
    canReadAPIKeys,
    isComingSoon,
    shouldDisableUI,
    showCreateButton,
    showRolloutCallout,
  }
}
