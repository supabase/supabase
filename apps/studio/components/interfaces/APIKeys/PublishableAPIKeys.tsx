import { useMemo } from 'react'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { Input, Separator } from 'ui'
import { Link } from 'lucide-react'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import CopyButton from 'components/ui/CopyButton'
import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'
import QuickKeyCopyWrapper from './QuickKeyCopy'

const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const { data: apiKeysData } = useAPIKeysQuery({ projectRef })

  const publishableApiKeys = useMemo(
    () => apiKeysData?.filter(({ type }) => type === 'publishable') ?? [],
    [apiKeysData]
  )

  return (
    <div>
      <FormHeader
        title="Publishable key"
        description="Use these API keys on the web, in mobile or desktop apps, CLIs or other public components of your app. It's safe to publish these."
      />
      <div className="flex flex-col gap-8">
        {publishableApiKeys.map((apiKey) => (
          <div key={apiKey.id} className="-space-y-px w-content w-fit">
            <div className="bg-surface-100 px-5 py-2 flex items-center gap-5 rounded-t-md border">
              <span className="text-sm">Default publishable key</span>
              <div className="flex items-center gap-2">
                <Input
                  size="tiny"
                  className="flex-1 grow gap-1 font-mono rounded-full"
                  value={apiKey.api_key}
                  containerClassName="min-w-96"
                />
                <CopyButton
                  type="default"
                  text={apiKey.api_key}
                  iconOnly
                  size={'tiny'}
                  className="px-2 rounded-full"
                />
              </div>
            </div>
            <div className="text-xs bg-surface-100/50 rounded-b-md border px-5 text-foreground-lighter py-1">
              this key can be safely shared in public
            </div>
          </div>
        ))}
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
