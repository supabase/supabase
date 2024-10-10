import { useMemo } from 'react'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { cn, Input_Shadcn_, Separator } from 'ui'
import { Link } from 'lucide-react'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import CopyButton from 'components/ui/CopyButton'
import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'
import QuickKeyCopyWrapper from './QuickKeyCopy'

const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const { data: apiKeysData, isLoading: isLoadingApiKeys } = useAPIKeysQuery({ projectRef })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  const apiKey = publishableApiKeys[0]

  return (
    <div>
      <FormHeader
        title="Publishable key"
        description="Use these API keys on the web, in mobile or desktop apps, CLIs or other public components of your app. It's safe to publish these."
      />
      <div className="flex flex-col gap-8">
        <div className="-space-y-px w-content w-fit">
          <div className="bg-surface-100 px-5 py-2 flex items-center gap-5 rounded-t-md border">
            <span className="text-sm">Default publishable key</span>
            <div className="flex items-center gap-2">
              <Input_Shadcn_
                key={apiKey?.id}
                size="tiny"
                className={cn(
                  isLoadingApiKeys && 'animate-pulse',
                  'flex-1 grow gap-1 font-mono rounded-full min-w-60 truncate'
                )}
                value={apiKey?.api_key}
              />
              <CopyButton
                type="default"
                text={apiKey?.api_key}
                iconOnly
                size={'tiny'}
                className="px-2 rounded-full"
              />
            </div>
          </div>
          <div className="text-xs bg-200 rounded-b-md border px-5 text-foreground-lighter py-1">
            Publishable key can be safely shared in public
          </div>
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

export default PublishableAPIKeys
