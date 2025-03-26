import { PermissionAction } from '@supabase/shared-types/out/constants'
import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Link } from 'lucide-react'
import { useMemo } from 'react'
import { cn, EyeOffIcon, Input_Shadcn_, Skeleton, WarningIcon } from 'ui'
import QuickKeyCopyWrapper from './QuickKeyCopy'
// to add in later with follow up PR
// import CreatePublishableAPIKeyModal from './CreatePublishableAPIKeyModal'
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

  const isPermissionsLoading = !usePermissionsLoaded()
  const canReadAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')

  // The default publisahble key will always be the first one
  const apiKey = publishableApiKeys[0]

  return (
    <div>
      <FormHeader
        title="Publishable key"
        description="Use these API keys on the web, in mobile or desktop apps, CLIs or other public components of your app. It's safe to publish these."
      />
      <div className="flex flex-col gap-8">
        <div className="-space-y-px w-content w-fit">
          <div className="bg-surface-100 px-5 py-2 flex items-center gap-5 first:rounded-t-md border">
            <span className="text-sm">Default publishable key</span>
            <div className="flex items-center gap-2">
              <ApiKeyInput />
              <CopyButton
                disabled={isPermissionsLoading || isLoadingApiKeys || !canReadAPIKeys}
                type="default"
                text={apiKey?.api_key}
                iconOnly
                size={'tiny'}
                className="px-2 rounded-full"
              />
            </div>
          </div>
          {error && canReadAPIKeys ? (
            <div className="text-xs bg-warning-200 last:rounded-b-md border border-warning-400 px-5 text-foreground-lighter py-1">
              <div className="text-warning">Failed to load publishable key: {error?.message}</div>
            </div>
          ) : (
            <div className="text-xs bg-200 last:rounded-b-md border px-5 text-foreground-lighter py-1">
              Publishable key can be safely shared in public
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 max-w-64">
          <div className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground cursor-pointer">
            <Link size={14} className="text-foreground-light" /> Show Supabase Url
          </div>
          {/* <Separator /> */}
          {/* @mildtomato - To add in later with follow up PR */}
          {/* <ShowPublicJWTsDialogComposer /> */}
        </div>

        {/* <CreatePublishableAPIKeyModal /> */}

        <QuickKeyCopyWrapper />
      </div>
    </div>
  )
}

function ApiKeyInput() {
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
  const isPermissionsLoading = !usePermissionsLoaded()
  const canReadAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')
  // The default publisahble key will always be the first one
  const apiKey = publishableApiKeys[0]

  const baseClasses = 'flex-1 grow gap-1 rounded-full min-w-[300px] truncate'
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
