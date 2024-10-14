import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { Link } from 'lucide-react'
import { useMemo } from 'react'
import { cn, Input_Shadcn_, Separator, Skeleton, WarningIcon } from 'ui'
import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'
import QuickKeyCopyWrapper from './QuickKeyCopy'
import { ResponseError } from 'types'

const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()

  const { data: apiKeysData, isLoading: isLoadingApiKeys, error } = useAPIKeysQuery({ projectRef })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

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
              {renderApiKeyInput(isLoadingApiKeys, apiKey, error)}
              <CopyButton
                type="default"
                text={apiKey?.api_key}
                iconOnly
                size={'tiny'}
                className="px-2 rounded-full"
              />
            </div>
          </div>
          {error ? (
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
          <Separator />
          <ShowPublicJWTsDialogComposer />
        </div>

        <QuickKeyCopyWrapper />
      </div>
    </div>
  )
}

const renderApiKeyInput = (isLoading: boolean, apiKey: any, error: ResponseError | null) => {
  const baseClasses = 'flex-1 grow gap-1 rounded-full min-w-60 truncate'
  const size = 'tiny'

  if (isLoading) {
    return (
      <div className={cn(InputVariants({ size }), baseClasses, 'items-center')}>
        <Skeleton className="h-2 w-48 rounded-full bg-foreground-muted" />
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

export default PublishableAPIKeys
