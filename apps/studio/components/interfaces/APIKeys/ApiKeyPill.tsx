import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useAPIKeyIdQuery } from 'data/api-keys/api-key-id-query'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
    isPending: isLoading,
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
      gcTime: 0, // Don't cache the key data
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

  async function onSubmitToggle() {
    // Don't reveal key if not allowed or loading
    if (isSecret && !canManageSecretKeys) return
    if (isLoadingPermission) return

    // Toggle the show state
    setShowState(!show)
  }

  async function onCopy() {
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
    } catch (error:unknown) {
      console.error('Failed to fetch API key:', error)
      return ''
    }

    // Fallback to the masked version if fetch fails
    return apiKey.api_key
  }

  // States for disabling buttons/showing tooltips
  const isRestricted = isSecret && !canManageSecretKeys

  return (
    <>
      <div
        className={cn(
          InputVariants({ size: 'tiny' }),
          'w-[100px] sm:w-[140px] md:w-[180px] lg:w-[340px] gap-0 font-mono rounded-full',
          isSecret ? 'overflow-hidden' : '',
          show ? 'ring-1 ring-foreground-lighter ring-opacity-50' : 'ring-0 ring-opacity-0',
          'transition-all cursor-text relative'
        )}
        style={{ userSelect: 'all' }}
      >
        {isSecret ? (
          <>
            <span>{apiKey?.api_key.slice(0, 15)}</span>
            <span>{show && data?.api_key ? data?.api_key.slice(15) : '••••••••••••••••'}</span>
          </>
        ) : (
          <span title={apiKey.api_key} className="truncate">
            {apiKey.api_key}
          </span>
        )}
      </div>

      {/* Toggle button */}
      {isSecret && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="outline"
              className="rounded-full px-2 pointer-events-auto"
              loading={show && isLoading}
              icon={show ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
              onClick={onSubmitToggle}
              disabled={isRestricted}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isRestricted
              ? 'You need additional permissions to reveal secret API keys'
              : isLoadingPermission
                ? 'Loading permissions...'
                : show
                  ? 'Hide API key'
                  : 'Reveal API key'}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <CopyButton
            type="default"
            asyncText={onCopy}
            iconOnly
            className="rounded-full px-2 pointer-events-auto"
            disabled={isRestricted || isLoadingPermission}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isRestricted
            ? 'You need additional permissions to copy secret API keys'
            : isLoadingPermission
              ? 'Loading permissions...'
              : 'Copy API key'}
        </TooltipContent>
      </Tooltip>
    </>
  )
}
