import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { ExternalLink, Plug } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

import { ApiKeysTabContent } from 'components/interfaces/Connect/ApiKeysTabContent'
import { DatabaseConnectionString } from 'components/interfaces/Connect/DatabaseConnectionString'
import { McpTabContent } from 'components/interfaces/Connect/McpTabContent'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { useRouter } from 'next/router'
import {
  Button,
  DIALOG_PADDING_X,
  DIALOG_PADDING_Y,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { CONNECTION_TYPES, ConnectionType, FRAMEWORKS, MOBILES, ORMS } from './Connect.constants'
import { getContentFilePath, inferConnectTabFromParentKey } from './Connect.utils'
import { ConnectDropdown } from './ConnectDropdown'
import { ConnectTabContent } from './ConnectTabContent'
import Link from 'next/link'

export const Connect = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const {
    projectConnectionShowAppFrameworks: showAppFrameworks,
    projectConnectionShowMobileFrameworks: showMobileFrameworks,
    projectConnectionShowOrms: showOrms,
  } = useIsFeatureEnabled([
    'project_connection:show_app_frameworks',
    'project_connection:show_mobile_frameworks',
    'project_connection:show_orms',
  ])

  const connectionTypes = CONNECTION_TYPES.filter(({ key }) => {
    if (key === 'frameworks') {
      return showAppFrameworks
    }
    if (key === 'mobiles') {
      return showMobileFrameworks
    }
    if (key === 'orms') {
      return showOrms
    }
    return true
  })

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )

  // helper to get the connection type object
  function getConnectionObjectForTab(tab: string | null) {
    switch (tab) {
      case 'frameworks':
        return FRAMEWORKS
      case 'mobiles':
        return MOBILES
      case 'orms':
        return ORMS
      default:
        return FRAMEWORKS
    }
  }

  const [tab, setTab] = useQueryState('connectTab', parseAsString.withDefault('direct'))
  const [queryFramework, setQueryFramework] = useQueryState('framework', parseAsString)
  const [queryUsing, setQueryUsing] = useQueryState('using', parseAsString)
  const [queryWith, setQueryWith] = useQueryState('with', parseAsString)
  const [_, setQueryType] = useQueryState('type', parseAsString)
  const [__, setQuerySource] = useQueryState('source', parseAsString)
  const [___, setQueryMethod] = useQueryState('method', parseAsString)

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
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const handleParentChange = (value: string) => {
    setSelectedParent(value)
    setQueryFramework(value)

    const parent = connectionObject.find((item) => item.key === value)
    const firstChild = parent?.children?.[0]

    if (firstChild) {
      setSelectedChild(firstChild.key)
      setQueryUsing(firstChild.key)

      const firstGrandchild = firstChild.children?.[0]
      if (firstGrandchild) {
        setSelectedGrandchild(firstGrandchild.key)
        setQueryWith(firstGrandchild.key)
      } else {
        setSelectedGrandchild('')
        setQueryWith(null)
      }
    } else {
      setSelectedChild('')
      setQueryUsing(null)
      setSelectedGrandchild('')
      setQueryWith(null)
    }
  }

  const handleChildChange = (value: string) => {
    setSelectedChild(value)
    setQueryUsing(value)

    const parent = connectionObject.find((item) => item.key === selectedParent)
    const child = parent?.children.find((child) => child.key === value)
    const firstGrandchild = child?.children?.[0]

    if (firstGrandchild) {
      setSelectedGrandchild(firstGrandchild.key)
      setQueryWith(firstGrandchild.key)
    } else {
      setSelectedGrandchild('')
      setQueryWith(null)
    }
  }

  const handleGrandchildChange = (value: string) => {
    setSelectedGrandchild(value)
    if (value) {
      setQueryWith(value)
    } else {
      setQueryWith(null)
    }
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
    setTab(type)

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

  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
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

  const resetQueryStates = () => {
    setQueryFramework(null)
    setQueryUsing(null)
    setQueryWith(null)
    setQueryType(null)
    setQuerySource(null)
    setQueryMethod(null)
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowConnect(null)
      setTab(null)
      resetQueryStates()
    } else {
      setShowConnect(open)
    }
  }

  useEffect(() => {
    if (!showConnect) return
    const noConnectTabInUrl = typeof router.query.connectTab === 'undefined'
    const hasQuery = queryFramework || queryUsing || queryWith
    const inferred = inferConnectTabFromParentKey(queryFramework)

    if (noConnectTabInUrl && hasQuery && inferred) {
      setTab(inferred)
      if (inferred === 'frameworks') setConnectionObject(FRAMEWORKS)
      if (inferred === 'mobiles') setConnectionObject(MOBILES)
      if (inferred === 'orms') setConnectionObject(ORMS)
    }
  }, [showConnect, router.query.connectTab, queryFramework, queryUsing, queryWith, setTab])

  useEffect(() => {
    if (!showConnect) return

    const newConnectionObject = getConnectionObjectForTab(tab)
    setConnectionObject(newConnectionObject)

    const parent =
      newConnectionObject.find((item) => item.key === queryFramework) ?? newConnectionObject[0]
    setSelectedParent(parent?.key ?? '')

    if (queryFramework) {
      if (parent?.key !== queryFramework) setQueryFramework(parent?.key ?? null)
    }

    const child =
      parent?.children.find((child) => child.key === queryUsing) ?? parent?.children?.[0]
    setSelectedChild(child?.key ?? '')

    if (queryUsing) {
      if (child?.key !== queryUsing) setQueryUsing(child?.key ?? null)
    }

    const grandchild =
      child?.children.find((child) => child.key === queryWith) ?? child?.children?.[0]
    setSelectedGrandchild(grandchild?.key ?? '')

    if (queryWith) {
      if (grandchild?.key !== queryWith) setQueryWith(grandchild?.key ?? null)
    }
  }, [
    showConnect,
    tab,
    queryFramework,
    setQueryFramework,
    queryUsing,
    setQueryUsing,
    queryWith,
    setQueryWith,
  ])

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
    <Dialog open={showConnect} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button type="default" className="rounded-full" icon={<Plug className="rotate-90" />}>
          <span>Connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-5xl p-0 rounded-lg')} centered={false}>
        <DialogHeader className={cn('text-left', DIALOG_PADDING_X)}>
          <DialogTitle>
            Connect to your project
            {connectionTypes.length === 1 ? ` via ${connectionTypes[0].label.toLowerCase()}` : null}
          </DialogTitle>
          <DialogDescription>
            Get the connection strings and environment variables for your app.
          </DialogDescription>
        </DialogHeader>

        <Tabs_Shadcn_
          value={tab}
          onValueChange={(value) => {
            resetQueryStates()
            handleConnectionType(value)
          }}
        >
          {connectionTypes.length > 1 ? (
            <TabsList_Shadcn_ className={cn('flex overflow-x-scroll gap-x-4', DIALOG_PADDING_X)}>
              {connectionTypes.map((type) => (
                <TabsTrigger_Shadcn_ key={type.key} value={type.key} className="px-0">
                  {type.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
          ) : (
            <DialogSectionSeparator />
          )}

          {connectionTypes.map((type) => {
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

            if (type.key === 'mcp') {
              return (
                <TabsContent_Shadcn_
                  key="mcp"
                  value="mcp"
                  className={cn(DIALOG_PADDING_X, DIALOG_PADDING_Y, '!mt-0')}
                >
                  <McpTabContent projectKeys={projectKeys} />
                </TabsContent_Shadcn_>
              )
            }

            if (type.key === 'api-keys') {
              return (
                <TabsContent_Shadcn_
                  key="api-keys"
                  value="api-keys"
                  className={cn(DIALOG_PADDING_X, DIALOG_PADDING_Y, '!mt-0')}
                >
                  <ApiKeysTabContent projectKeys={projectKeys} />
                </TabsContent_Shadcn_>
              )
            }

            const connectionTabMap: Record<
              string,
              'App Frameworks' | 'Mobile Frameworks' | 'ORMs'
            > = {
              frameworks: 'App Frameworks',
              mobiles: 'Mobile Frameworks',
              orms: 'ORMs',
            }
            const connectionTab = connectionTabMap[type.key] || 'App Frameworks'
            const selectedFrameworkOrTool =
              connectionObject.find((item) => item.key === selectedParent)?.label || ''

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
                  connectionTab={connectionTab}
                  selectedFrameworkOrTool={selectedFrameworkOrTool}
                  className="rounded-b-none"
                />
                {IS_PLATFORM && (
                  <Panel.Notice
                    className="border border-t-0 rounded-lg rounded-t-none"
                    badgeLabel="Changelog"
                    title="New publishable and secret API keys"
                    description={
                      <>
                        <p>
                          View your publishable and secret API keys from the project{' '}
                          <Link href={`/project/${projectRef}/settings/api-keys`}>
                            API settings page
                          </Link>
                        </p>
                        <p>
                          To learn more about the new API keys, read the{' '}
                          <a
                            href="https://supabase.com/docs/guides/api/api-keys"
                            target="_blank"
                            rel="noreferrer"
                          >
                            documentation
                          </a>
                        </p>
                      </>
                    }
                    href={`${BASE_PATH}/project/${projectRef}/settings/api-keys`}
                    buttonText="View API keys"
                  />
                )}
              </TabsContent_Shadcn_>
            )
          })}
        </Tabs_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
