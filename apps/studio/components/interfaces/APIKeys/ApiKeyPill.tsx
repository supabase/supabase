import { PermissionAction } from '@supabase/shared-types/out/constants'
import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useRevealedSecret } from './useRevealedSecret'
import CopyButton from '@/components/ui/CopyButton'
import { APIKeysData } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export function ApiKeyPill({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) {
  const { ref: projectRef } = useParams()
  const [show, setShow] = useState(false)

  const isSecret = apiKey.type === 'secret'

  const { can: canManageSecretKeys, isLoading: isLoadingPermission } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const {
    data: revealedKey,
    isLoading,
    reveal,
    clear,
  } = useRevealedSecret({
    projectRef,
    id: apiKey.id as string,
  })

  // Auto-hide timer for the API key (security feature)
  useEffect(() => {
    if (show && revealedKey) {
      const timer = setTimeout(() => {
        setShow(false)
        clear()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [show, revealedKey, clear])

  async function onToggleShow() {
    if (isSecret && !canManageSecretKeys) return
    if (isLoadingPermission) return

    if (show) {
      setShow(false)
      clear()
    } else {
      setShow(true)
      try {
        await reveal()
      } catch {
        toast.error('Failed to reveal secret API key')
        setShow(false)
      }
    }
  }

  async function onCopy() {
    if (!isSecret) return apiKey.api_key
    if (revealedKey) return revealedKey

    try {
      const key = await reveal()
      clear()
      return key ?? ''
    } catch {
      toast.error('Failed to copy secret API key')
      return apiKey.api_key
    }
  }

  const isRestricted = isSecret && !canManageSecretKeys

  return (
    <>
      <div
        className={cn(
          InputVariants({ size: 'tiny' }),
          'w-[100px] sm:w-[140px] md:w-[180px] lg:w-[340px] gap-0 font-mono rounded-full',
          isSecret ? 'overflow-hidden' : '',
          show ? 'ring-1 ring-foreground-lighter/50' : 'ring-0 ring-foreground-lighter/0',
          'transition-all cursor-text relative'
        )}
        style={{ userSelect: 'all' }}
      >
        {isSecret ? (
          <>
            <span>{apiKey?.api_key.slice(0, 15)}</span>
            <span>{show && revealedKey ? revealedKey.slice(15) : '••••••••••••••••'}</span>
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
              onClick={onToggleShow}
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
