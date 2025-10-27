import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  cn,
  EyeOffIcon,
  Input_Shadcn_,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'

// to add in later with follow up PR
// import CreatePublishableAPIKeyDialog from './CreatePublishableAPIKeyDialog'
// to add in later with follow up PR
// import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'

export const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const {
    data: apiKeysData,
    isLoading: isLoadingApiKeys,
    error,
  } = useAPIKeysQuery({ projectRef, reveal: false })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  const { can: canReadAPIKeys, isLoading: isPermissionsLoading } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )

  // The default publisahble key will always be the first one
  const apiKey = publishableApiKeys[0]

  return (
    <div>
      <FormHeader
        title="Publishable key"
        description="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies."
      />
      <div className="flex flex-col gap-8">
        <div className="-space-y-px w-full lg:w-content lg:w-fit">
          <div className="bg-surface-100 px-5 py-2 flex items-center gap-5 first:rounded-t-md border">
            <span className="text-sm">Publishable key</span>
            <div className="flex items-center gap-2">
              <ApiKeyInput />
              <Tooltip>
                <TooltipTrigger asChild>
                  <CopyButton
                    iconOnly
                    size="tiny"
                    type="default"
                    className="px-2 rounded-full"
                    disabled={isPermissionsLoading || isLoadingApiKeys || !canReadAPIKeys}
                    text={apiKey?.api_key}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!canReadAPIKeys
                    ? 'You need additional permissions to copy publishable keys'
                    : isLoadingApiKeys
                      ? 'Loading permissions...'
                      : 'Copy publishable key'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {error && canReadAPIKeys ? (
            <div className="text-xs bg-warning-200 last:rounded-b-md border border-warning-400 px-5 text-foreground-lighter py-1">
              <div className="text-warning">Failed to load publishable key: {error?.message}</div>
            </div>
          ) : (
            <div className="text-xs bg-200 last:rounded-b-md border px-5 text-foreground-lighter py-1">
              The publishable key can be safely shared publicly
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ApiKeyInput = () => {
  const { ref: projectRef } = useParams()

  const {
    data: apiKeysData,
    isLoading: isApiKeysLoading,
    error,
  } = useAPIKeysQuery({ projectRef, reveal: false })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  const { can: canReadAPIKeys, isLoading: isPermissionsLoading } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )
  // The default publisahble key will always be the first one
  const apiKey = publishableApiKeys[0]

  const baseClasses =
    'flex-1 grow gap-1 rounded-full min-w-0 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:min-w-[24rem]'
  const size = 'tiny'

  if (isApiKeysLoading || isPermissionsLoading) {
    return (
      <div className={cn(InputVariants({ size }), baseClasses, 'items-center')}>
        <Skeleton className="h-2 w-48 rounded-full bg-foreground-muted" />
      </div>
    )
  }

  if (!canReadAPIKeys) {
    return (
      <div className={cn(InputVariants({ size }), baseClasses, 'items-center gap-2 font-normal')}>
        <EyeOffIcon />
        You do not have permission to read API Key
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(InputVariants({ size }), baseClasses, 'items-center gap-2 font-normal')}>
        <WarningIcon />
        Failed to load publishable key
      </div>
    )
  }

  return (
    <Input_Shadcn_
      key={apiKey?.id}
      size={size}
      className={cn(baseClasses, 'font-mono')}
      value={apiKey?.api_key}
    />
  )
}
