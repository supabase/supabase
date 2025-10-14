import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useAPIKeyIdQuery } from 'data/api-keys/[id]/api-key-id-query'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Input } from 'ui-patterns/DataInputs/Input'

export function ApiKeyPill({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  // State that controls whether to show the full API key
  const [show, setShowState] = useState(false)

  const isSecret = apiKey.type === 'secret'

  // Permission check for revealing/copying secret API keys
  const { can: canManageSecretKeys, isLoading: isLoadingPermission } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  // This query only runs when show=true (enabled: show)
  // It fetches the fully revealed API key when needed
  const {
    data,
    error,
    refetch: refetchApiKey,
  } = useAPIKeyIdQuery(
    {
      projectRef,
      id: apiKey.id as string,
      reveal: true, // Request the unmasked key
    },
    {
      enabled: show, // Only run query when show is true
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // Don't cache the key data
    }
  )

  // Auto-hide timer for the API key (security feature)
  useEffect(() => {
    if (show && data?.api_key) {
      // Auto-hide the key after 10 seconds
      const timer = setTimeout(() => {
        setShowState(false)
        // Clear the cached key from memory
        queryClient.removeQueries({
          queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
          exact: true,
        })
      }, 10000) // Hide after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [show, data?.api_key, projectRef, queryClient, apiKey.id])

  async function handleReveal() {
    // Don't reveal key if not allowed or loading
    if (isSecret && !canManageSecretKeys) return
    if (isLoadingPermission) return

    // Toggle the show state
    setShowState(!show)
  }

  async function handleCopy(): Promise<string> {
    // If key is already revealed, use that value
    if (data?.api_key) return data?.api_key ?? ''

    try {
      // Fetch full key and immediately clear from cache after copying
      const result = await refetchApiKey()
      queryClient.removeQueries({
        queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
        exact: true,
      })

      if (result.isSuccess) return result.data.api_key ?? ''

      if (error) {
        toast.error('Failed to copy secret API key')
        return ''
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
      return ''
    }

    // Fallback to the masked version if fetch fails
    return apiKey.api_key
  }

  function handleAutoHide() {
    setShowState(false)
    // Clear the cached key from memory
    queryClient.removeQueries({
      queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
      exact: true,
    })
  }

  // States for disabling buttons/showing tooltips
  const isRestricted = isSecret && !canManageSecretKeys

  // Format the display value for secret keys
  const displayValue = isSecret
    ? `${apiKey?.api_key.slice(0, 15)}${show && data?.api_key ? data?.api_key.slice(15) : '••••••••••••••••'}`
    : apiKey?.api_key

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
    />
  )
}
