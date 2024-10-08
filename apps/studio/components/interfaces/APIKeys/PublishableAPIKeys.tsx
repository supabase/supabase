import { useMemo } from 'react'

import { useParams } from 'common'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button, CodeBlock, Separator } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import Table from 'components/to-be-cleaned/Table'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'

import CreatePublishableAPIKeyModal from './CreatePublishableAPIKeyModal'
import APIKeyRow from './APIKeyRow'

import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { Input } from 'ui-patterns/DataInputs/Input'
import {
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronsUpDownIcon,
  ClipboardCopy,
  Copy,
  Eye,
  Key,
  Link,
  Plug,
} from 'lucide-react'
import Connect from '../Home/Connect/Connect'
import ConnectTabContentNew from '../Home/Connect/ConnectTabContent'
import SimpleCodeBlock from 'ui/src/components/SimpleCodeBlock/SimpleCodeBlock'
import CopyButton from 'components/ui/CopyButton'
import ShowPublicJWTsDialogComposer from '../JwtSecrets/ShowPublicJWTsDialogComposer'

const PublishableAPIKeys = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const { data: projectAPI } = useProjectApiQuery({ projectRef: projectRef })

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
        // actions={<CreatePublishableAPIKeyModal projectRef={projectRef} />}
      />
      {/* <Table
        head={[
          <Table.th key="">API Key</Table.th>,
          <Table.th key="">Description</Table.th>,
          <Table.th key="actions" />,
        ]}
        body={
          publishableApiKeys.length === 0 ? (
            <Table.tr>
              <Table.td colSpan={3} className="!rounded-b-md overflow-hidden">
                <p className="text-sm text-foreground">No publishable API keys created yet</p>
                <p className="text-sm text-foreground-light">
                  Your project can't be accessed from the web using publishable API keys.
                </p>
              </Table.td>
            </Table.tr>
          ) : (
            publishableApiKeys.map((apiKey) => <APIKeyRow key={apiKey.id} apiKey={apiKey} />)
          )
        }
      /> */}
      {publishableApiKeys.map((apiKey) => (
        // <APIKeyRow key={apiKey.id} apiKey={apiKey} />
        <div className="-space-y-px w-content w-fit">
          <div className="bg-surface-100 px-5 py-2 flex items-center gap-5 rounded-t-md border">
            <span className="text-sm">Default publishable key</span>
            <div className="flex items-center gap-2">
              <Input
                size="tiny"
                // icon={<Key width={13} strokeWidth={1.5} className="text-foreground-light" />}
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
      <div className="mt-8 flex flex-col gap-2 max-w-64">
        <div className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground cursor-pointer">
          <Link size={14} className="text-foreground-light" /> Show Supabase Url
        </div>
        <Separator />
        <ShowPublicJWTsDialogComposer />
      </div>

      {/* // dark quick copy for all frameworks */}
      <div className="mt-8 flex flex-col gap-0 bg-alternative/50 border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 text-xs px-5 py-3 justify-between">
          <div className="flex flex-col gap-0">
            <h4 className="text-sm">Quick key copy</h4>
            <p className="text-foreground-lighter">
              Choose your framework and paste the code into your environment file.
            </p>
          </div>
          <Button type="default" iconRight={<ChevronsUpDownIcon />}>
            React
          </Button>
        </div>
        <div className="bg-alternative px-5 py-3 border-t overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-foreground w-4 h-4 flex items-end justify-center rounded-sm">
              <span className="font-mono text-[8px] text-background font-bold">env</span>
            </div>
            <span className="font-mono text-xs">.env.local</span>
          </div>
          <SimpleCodeBlock parentClassName="!p-0">{`
NEXT_PUBLIC_SUPABASE_URL=pk_test_c3VwZXJiLWdyb3VwZXItNDMuY2xlcmsuYWNjb3VudHMuZGV2JA
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY=••••••••••••••••••••••••••••••••••••••••••••••••••
`}</SimpleCodeBlock>
        </div>
      </div>
    </div>
  )
}

export default PublishableAPIKeys
