import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'

import { useState } from 'react'

import { useParams } from 'common'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { get, handleError } from 'data/fetchers'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Input } from 'ui-patterns/DataInputs/Input'

export function ApiKeyPill({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const [revealedValue, setRevealedValue] = useState<string | null>(null)
  const isSecret = apiKey.type === 'secret'

  // Permission check for revealing/copying secret API keys
  const { can: canManageSecretKeys, isLoading: isLoadingPermission } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const isRestricted = isSecret && !canManageSecretKeys

  // Function to fetch the full API key
  async function fetchFullApiKey(): Promise<string> {
    if (!apiKey.id) return apiKey.api_key // Early return if no id

    try {
      const { data, error } = await get('/v1/projects/{ref}/api-keys/{id}', {
        params: {
          path: { ref: projectRef, id: apiKey.id },
          query: { reveal: true },
        },
      })

      if (error) {
        handleError(error)
        return apiKey.api_key // Fallback to masked version
      }

      return data.api_key ?? apiKey.api_key
    } catch (error) {
      console.error('Failed to fetch API key:', error)
      return apiKey.api_key // Fallback to masked version
    }
  }

  async function handleCopy(): Promise<string> {
    if (!isSecret) return apiKey.api_key

    // If we already have the revealed value, use it
    if (revealedValue) return revealedValue

    // Otherwise fetch it
    const fullKey = await fetchFullApiKey()

    // Clear from cache after copying
    if (apiKey.id) {
      queryClient.removeQueries({
        queryKey: apiKeysKeys.single(projectRef, apiKey.id),
        exact: true,
      })
    }

    return fullKey
  }

  // Custom reveal handler that fetches the full key
  async function handleReveal() {
    if (!isSecret || isRestricted || isLoadingPermission) return

    if (!revealedValue) {
      const fullKey = await fetchFullApiKey()
      setRevealedValue(fullKey)
    } else {
      setRevealedValue(null)
    }
  }

  // Create custom hidden placeholder that shows first 15 characters + dots
  const hiddenPlaceholder = isSecret ? `${apiKey.api_key.slice(0, 15)}••••••••••••••••` : undefined

  // Determine what value to display - use revealed value if available, otherwise use the masked version
  const displayValue = isSecret ? revealedValue || apiKey.api_key : apiKey.api_key

  return (
    <Input
      readOnly
      value={displayValue}
      containerClassName="w-full"
      className="font-mono"
      copy
      onCopy={handleCopy}
      reveal={isSecret}
      onReveal={handleReveal}
      hiddenPlaceholder={hiddenPlaceholder}
      disabled={isRestricted || isLoadingPermission}
    />
  )
}
