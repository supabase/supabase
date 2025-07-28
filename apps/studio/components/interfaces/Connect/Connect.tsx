import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ExternalLink, Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import { DatabaseConnectionString } from 'components/interfaces/Connect/DatabaseConnectionString'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  DIALOG_PADDING_X,
  DIALOG_PADDING_Y,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { CONNECTION_TYPES, ConnectionType, FRAMEWORKS, MOBILES, ORMS } from './Connect.constants'
import { getContentFilePath } from './Connect.utils'
import ConnectDropdown from './ConnectDropdown'
import ConnectTabContent from './ConnectTabContent'

export const Connect = () => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )

  const [connectionObject, setConnectionObject] = useState<ConnectionType[]>(FRAMEWORKS)
  const [selectedParent, setSelectedParent] = useState(connectionObject[0].key) // aka nextjs
  const [selectedChild, setSelectedChild] = useState(
    connectionObject.find((item) => item.key === selectedParent)?.children[0]?.key ?? ''
  )
  const [selectedGrandchild, setSelectedGrandchild] = useState(
    connectionObject
      .find((item) => item.key === selectedParent)
      ?.children.find((child) => child.key === selectedChild)?.children[0]?.key || ''
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef }, { enabled: showConnect })
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const handleParentChange = (value: string) => {
    setSelectedParent(value)

    // check if parent has children
    setSelectedChild(connectionObject.find((item) => item.key === value)?.children[0]?.key ?? '')

    // check if child has grandchildren
    setSelectedGrandchild(
      connectionObject.find((item) => item.key === value)?.children[0]?.children[0]?.key ?? ''
    )
  }

  const handleChildChange = (value: string) => {
    setSelectedChild(value)

    const parent = connectionObject.find((item) => item.key === selectedParent)
    const child = parent?.children.find((child) => child.key === value)

    if (child && child.children.length > 0) {
      setSelectedGrandchild(child.children[0].key)
    } else {
      setSelectedGrandchild('')
    }
  }

  const handleGrandchildChange = (value: string) => {
    setSelectedGrandchild(value)
  }

  // reset the parent/child/grandchild when the connection type (tab) changes
  function handleConnectionTypeChange(connections: ConnectionType[]) {
    setSelectedParent(connections[0].key)

    if (connections[0]?.children.length > 0) {
      setSelectedChild(connections[0].children[0].key)

      if (connections[0].children[0]?.children.length > 0) {
        setSelectedGrandchild(connections[0].children[0].children[0].key)
      } else {
        setSelectedGrandchild('')
      }
    } else {
      setSelectedChild('')
      setSelectedGrandchild('')
    }
  }

  function handleConnectionType(type: string) {
    if (type === 'frameworks') {
      setConnectionObject(FRAMEWORKS)
      handleConnectionTypeChange(FRAMEWORKS)
    }

    if (type === 'mobiles') {
      setConnectionObject(MOBILES)
      handleConnectionTypeChange(MOBILES)
    }

    if (type === 'orms') {
      setConnectionObject(ORMS)
      handleConnectionTypeChange(ORMS)
    }
  }

  const getChildOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    if (parent && parent.children.length > 0) {
      return parent.children
    }
    return []
  }

  const getGrandchildrenOptions = () => {
    const parent = connectionObject.find((item) => item.key === selectedParent)
    const subCategory = parent?.children.find((child) => child.key === selectedChild)
    if (subCategory && subCategory.children.length > 0) {
      return subCategory.children
    }
    return []
  }

  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { anonKey, publishableKey } = canReadAPIKeys
    ? getKeys(apiKeys)
    : { anonKey: null, publishableKey: null }

  const projectKeys = useMemo(() => {
    const protocol = settings?.app_config?.protocol ?? 'https'
    const endpoint = settings?.app_config?.endpoint ?? ''
    const apiHost = canReadAPIKeys ? `${protocol}://${endpoint ?? '-'}` : ''

    return {
      apiUrl: apiHost ?? null,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: publishableKey?.api_key ?? null,
    }
  }, [
    settings?.app_config?.protocol,
    settings?.app_config?.endpoint,
    canReadAPIKeys,
    anonKey?.api_key,
    publishableKey?.api_key,
  ])

  const filePath = getContentFilePath({
    connectionObject,
    selectedParent,
    selectedChild,
    selectedGrandchild,
  })

  if (!isActiveHealthy) {
    return (
      <ButtonTooltip
        disabled
        type="default"
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        tooltip={{
          content: {
            side: 'bottom',
            text: 'Project is currently not active and cannot be connected',
          },
        }}
      >
        Connect
      </ButtonTooltip>
    )
  }

  return (
    <Dialog open={showConnect} onOpenChange={(open) => setShowConnect(!open ? null : open)}>
      <DialogTrigger asChild>
        <Button type="default" className="rounded-full" icon={<Plug className="rotate-90" />}>
          <span>Connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-5xl p-0')} centered={false}>
        <DialogHeader className={DIALOG_PADDING_X}>
          <DialogTitle>Connect to your project</DialogTitle>
          <DialogDescription>
            Get the connection strings and environment variables for your app
          </DialogDescription>
        </DialogHeader>

        <Tabs_Shadcn_ defaultValue="direct" onValueChange={(value) => handleConnectionType(value)}>
          <TabsList_Shadcn_ className={cn('flex overflow-x-scroll gap-x-4', DIALOG_PADDING_X)}>
            {CONNECTION_TYPES.map((type) => (
              <TabsTrigger_Shadcn_ key={type.key} value={type.key} className="px-0">
                {type.label}
              </TabsTrigger_Shadcn_>
            ))}
          </TabsList_Shadcn_>

          {CONNECTION_TYPES.map((type) => {
            const hasChildOptions =
              (connectionObject.find((parent) => parent.key === selectedParent)?.children.length ||
                0) > 0
            const hasGrandChildOptions =
              (connectionObject
                .find((parent) => parent.key === selectedParent)
                ?.children.find((child) => child.key === selectedChild)?.children.length || 0) > 0

            if (type.key === 'direct') {
              return (
                <TabsContent_Shadcn_
                  key="direct"
                  value="direct"
                  className={cn('!mt-0', 'p-0', 'flex flex-col gap-6')}
                >
                  <div className={DIALOG_PADDING_Y}>
                    <DatabaseConnectionString />
                  </div>
                </TabsContent_Shadcn_>
              )
            }

            return (
              <TabsContent_Shadcn_
                key={`content-${type.key}`}
                value={type.key}
                className={cn(DIALOG_PADDING_X, DIALOG_PADDING_Y, '!mt-0')}
              >
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                    <ConnectDropdown
                      state={selectedParent}
                      updateState={handleParentChange}
                      label={
                        connectionObject === FRAMEWORKS || connectionObject === MOBILES
                          ? 'Framework'
                          : 'Tool'
                      }
                      items={connectionObject}
                    />
                    {selectedParent && hasChildOptions && (
                      <ConnectDropdown
                        state={selectedChild}
                        updateState={handleChildChange}
                        label="Using"
                        items={getChildOptions()}
                      />
                    )}
                    {selectedChild && hasGrandChildOptions && (
                      <ConnectDropdown
                        state={selectedGrandchild}
                        updateState={handleGrandchildChange}
                        label="With"
                        items={getGrandchildrenOptions()}
                      />
                    )}
                  </div>
                  {connectionObject.find((item) => item.key === selectedParent)?.guideLink && (
                    <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          connectionObject.find((item) => item.key === selectedParent)?.guideLink ||
                          ''
                        }
                      >
                        {connectionObject.find((item) => item.key === selectedParent)?.label} guide
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-foreground-lighter my-3">
                  Add the following files below to your application
                </p>
                <ConnectTabContent
                  projectKeys={projectKeys}
                  filePath={filePath}
                  className="rounded-b-none"
                />
                <Panel.Notice
                  className="border border-t-0 rounded-lg rounded-t-none"
                  title="New API keys coming 2025"
                  description={`
\`anon\` and \`service_role\` API keys will be changing to \`publishable\` and \`secret\` API keys.   
`}
                  href="https://github.com/orgs/supabase/discussions/29260"
                  buttonText="Read the announcement"
                />
              </TabsContent_Shadcn_>
            )
          })}
        </Tabs_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
