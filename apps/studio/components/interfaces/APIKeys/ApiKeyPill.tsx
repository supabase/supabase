import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useAPIKeyIdQuery } from 'data/api-keys/[id]/api-key-id-query'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
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
  const { can: canManageSecretKeys, isLoading: isLoadingPermission } =
    useAsyncCheckProjectPermissions(PermissionAction.READ, 'service_api_keys')

  // This query only runs when show=true (enabled: show)
  // It fetches the fully revealed API key when needed
  const {
    data,
    isLoading: isLoadingApiKey,
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

  async function onSubmitShow() {
    // Don't reveal key if not allowed or loading
    if (isSecret && !canManageSecretKeys) return
    if (isLoadingPermission) return

    // This will enable the API key query to fetch and reveal the key
    setShowState(true)
  }

  async function onCopy() {
    // If key is already revealed, use that value
    if (data?.api_key) return data?.api_key

    try {
      // Fetch full key and immediately clear from cache after copying
      const result = await refetchApiKey()
      queryClient.removeQueries({
        queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
        exact: true,
      })

      if (result.isSuccess) return result.data.api_key

      if (error) {
        toast.error('Failed to copy secret API key')
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }

    // Fallback to the masked version if fetch fails
    return apiKey.api_key
  }

  // States for disabling buttons/showing tooltips
  const isRestricted = isSecret && !canManageSecretKeys
  const isLoading = isLoadingPermission

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <div
          className={cn(
            InputVariants({ size: 'tiny' }),
            'flex-1 grow gap-0 font-mono rounded-full',
            isSecret ? 'overflow-hidden' : '',
            show ? 'ring-1 ring-foreground-lighter ring-opacity-50' : 'ring-0 ring-opacity-0',
            'transition-all',
            'max-w-[340px]',
            'cursor-text',
            'relative'
          )}
          style={{ userSelect: 'all' }}
        >
          {isSecret ? (
            <>
              <span>{apiKey?.api_key.slice(0, 15)}</span>
              <motion.span
                key={show ? 'shown' : 'hidden'}
                initial={{ opacity: 0, y: show ? 16 : -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: show ? 16 : -16 }}
                transition={{
                  duration: 0.1,
                  y: { type: 'spring', stiffness: 1000, damping: 55 },
                }}
              >
                {show && data?.api_key ? data?.api_key.slice(15) : '••••••••••••••••'}
              </motion.span>
            </>
          ) : (
            <span>{apiKey?.api_key}</span>
          )}
        </div>
      </AnimatePresence>

      {/* Reveal button - only shown for secret keys and when not already revealed */}
      {isSecret && (
        <AnimatePresence initial={false}>
          {!show && (
            <motion.div
              initial={{ opacity: 0, scale: 1, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 1, width: 0 }}
              transition={{ duration: 0.12 }}
              style={{ overflow: 'hidden' }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="outline"
                    className="rounded-full px-2 pointer-events-auto cursor-default"
                    icon={<Eye strokeWidth={2} />}
                    onClick={onSubmitShow}
                    disabled={isRestricted}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isRestricted
                    ? 'You need additional permissions to reveal secret API keys'
                    : isLoadingPermission
                      ? 'Loading permissions...'
                      : 'Reveal API key'}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <CopyButton
            type="default"
            asyncText={onCopy}
            iconOnly
            className="rounded-full px-2 pointer-events-auto cursor-default"
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
