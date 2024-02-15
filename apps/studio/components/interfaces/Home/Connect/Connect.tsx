import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Plug } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  DIALOG_PADDING_X_Shadcn_,
  DIALOG_PADDING_Y_Shadcn_,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  DialogTrigger_Shadcn_,
  Dialog_Shadcn_,
  IconExternalLink,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'

import { DatabaseConnectionString } from 'components/interfaces/Settings/Database/DatabaseSettings/DatabaseConnectionString'
import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCheckPermissions } from 'hooks'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { CONNECTION_TYPES, ConnectionType, FRAMEWORKS, ORMS } from './Connect.constants'
import { getContentFilePath } from './Connect.utils'
import ConnectDropdown from './ConnectDropdown'
import ConnectTabContent from './ConnectTabContent'

const Connect = () => {
  const { ref: projectRef } = useParams()

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

  const { data: projectSettings } = useProjectSettingsQuery({ projectRef })

  const { data: apiSettings } = useProjectApiQuery({
    projectRef,
  })

  // Get the API service
  const apiService = (projectSettings?.services ?? []).find(
    (x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )

  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  // Get the API service
  const apiHost = canReadAPIKeys
    ? `${apiSettings?.autoApiService?.protocol ?? 'https'}://${
        apiSettings?.autoApiService?.endpoint ?? '-'
      }`
    : ''
  const apiUrl = canReadAPIKeys ? apiHost : null

  const anonKey = canReadAPIKeys
    ? apiService?.service_api_keys.find((key) => key.tags === 'anon')?.api_key ?? null
    : null

  const projectKeys = { apiUrl, anonKey }

  const filePath = getContentFilePath({
    connectionObject,
    selectedParent,
    selectedChild,
    selectedGrandchild,
  })

  return (
    <>
      <Dialog_Shadcn_>
        <DialogTrigger_Shadcn_ asChild>
          <Button type="primary">
            <span className="flex items-center gap-2 px-3">
              <Plug size={14} className="rotate-90" /> <span>Connect</span>
            </span>
          </Button>
        </DialogTrigger_Shadcn_>
        <DialogContent_Shadcn_ className={cn('sm:max-w-5xl p-0')}>
          <DialogHeader_Shadcn_ className="pb-0">
            <DialogTitle_Shadcn_>Connect to your project</DialogTitle_Shadcn_>
            <DialogDescription_Shadcn_>
              Get the connection strings and environment variables for your app
            </DialogDescription_Shadcn_>
          </DialogHeader_Shadcn_>

          <Tabs_Shadcn_
            defaultValue="direct"
            onValueChange={(value) => handleConnectionType(value)}
          >
            <TabsList_Shadcn_ className={cn('flex gap-4', DIALOG_PADDING_X_Shadcn_)}>
              <TabsTrigger_Shadcn_ key="direct" value="direct" className="px-0">
                Connection String
              </TabsTrigger_Shadcn_>
              {CONNECTION_TYPES.map((type) => (
                <TabsTrigger_Shadcn_ key={type.key} value={type.key} className="px-0">
                  {type.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>

            {CONNECTION_TYPES.map((type) => {
              const hasChildOptions =
                (connectionObject.find((parent) => parent.key === selectedParent)?.children
                  .length || 0) > 0
              const hasGrandChildOptions =
                (connectionObject
                  .find((parent) => parent.key === selectedParent)
                  ?.children.find((child) => child.key === selectedChild)?.children.length || 0) > 0

              return (
                <TabsContent_Shadcn_
                  key={`content-${type.key}`}
                  value={type.key}
                  className={cn(DIALOG_PADDING_X_Shadcn_, DIALOG_PADDING_Y_Shadcn_, '!mt-0')}
                >
                  <div className="flex justify-between">
                    <div className="flex items-center gap-5">
                      <ConnectDropdown
                        state={selectedParent}
                        updateState={handleParentChange}
                        label={connectionObject === FRAMEWORKS ? 'Framework' : 'Tool'}
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
                      <Button
                        asChild
                        type="default"
                        icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                      >
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={
                            connectionObject.find((item) => item.key === selectedParent)
                              ?.guideLink || ''
                          }
                        >
                          {connectionObject.find((item) => item.key === selectedParent)?.label}{' '}
                          guide
                        </a>
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-foreground-lighter my-3">
                    Add the following files below to your application
                  </p>
                  <ConnectTabContent projectKeys={projectKeys} filePath={filePath} />
                </TabsContent_Shadcn_>
              )
            })}
            <TabsContent_Shadcn_
              key="direct"
              value="direct"
              className={cn(DIALOG_PADDING_X_Shadcn_, DIALOG_PADDING_Y_Shadcn_, '!mt-0')}
            >
              <DatabaseConnectionString appearance="minimal" />
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
      <PoolingModesModal />
    </>
  )
}

export default Connect
