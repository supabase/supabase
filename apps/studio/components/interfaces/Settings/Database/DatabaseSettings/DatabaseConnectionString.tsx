import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Button, IconExternalLink, Input, Separator, Tabs } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useFlag } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { IPv4DeprecationNotice } from '../IPv4DeprecationNotice'
import { UsePoolerCheckbox } from '../UsePoolerCheckbox'
import {
  constructConnStringSyntax,
  getConnectionStrings,
  getPoolerTld,
} from './DatabaseSettings.utils'

const CONNECTION_TYPES = [
  { id: 'uri', label: 'URI' },
  { id: 'psql', label: 'PSQL' },
  { id: 'golang', label: 'Golang' },
  { id: 'jdbc', label: 'JDBC' },
  { id: 'dotnet', label: '.NET' },
  { id: 'nodejs', label: 'Nodejs' },
  { id: 'php', label: 'PHP' },
  { id: 'python', label: 'Python' },
]

export const DatabaseConnectionString = () => {
  const router = useRouter()
  const { project: projectDetails, isLoading: isProjectLoading } = useProjectContext()
  const { ref: projectRef, connectionString } = useParams()
  const telemetryProps = useTelemetryProps()
  const readReplicasEnabled = useFlag('readReplicas') && projectDetails?.is_read_replicas_enabled

  const state = useDatabaseSelectorStateSnapshot()

  const connectionStringsRef = useRef<HTMLDivElement>(null)
  const [usePoolerConnection, setUsePoolerConnection] = useState(true)
  const [selectedTab, setSelectedTab] = useState<
    'uri' | 'psql' | 'golang' | 'jdbc' | 'dotnet' | 'nodejs' | 'php' | 'python'
  >('uri')

  const { data: poolingInfo, isSuccess: isSuccessPoolingInfo } = usePoolingConfigurationQuery({
    projectRef,
  })

  const {
    data,
    error: projectSettingsError,
    isLoading: isLoadingProjectSettings,
    isError: isErrorProjectSettings,
    isSuccess: isSuccessProjectSettings,
  } = useProjectSettingsQuery({ projectRef })

  const {
    data: databases,
    error: readReplicasError,
    isLoading: isLoadingReadReplicas,
    isError: isErrorReadReplicas,
    isSuccess: isSuccessReadReplicas,
  } = useReadReplicasQuery({ projectRef })

  const error = readReplicasEnabled ? readReplicasError : projectSettingsError
  const isLoading = readReplicasEnabled ? isLoadingReadReplicas : isLoadingProjectSettings
  const isError = readReplicasEnabled ? isErrorReadReplicas : isErrorProjectSettings
  const isSuccess = readReplicasEnabled ? isSuccessReadReplicas : isSuccessProjectSettings

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )

  const { project } = data ?? {}
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = readReplicasEnabled
    ? pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)
    : pluckObjectFields(project || emptyState, DB_FIELDS)
  const connectionTld =
    projectDetails?.restUrl !== undefined
      ? new URL(projectDetails?.restUrl ?? '').hostname.split('.').pop() ?? 'co'
      : 'co'

  const handleCopy = (id: string) => {
    const labelValue = CONNECTION_TYPES.find((type) => type.id === id)?.label
    Telemetry.sendEvent(
      {
        category: 'settings',
        action: 'copy_connection_string',
        label: labelValue ? labelValue : '',
      },
      telemetryProps,
      router
    )
  }

  const connectionStrings = isSuccessPoolingInfo
    ? getConnectionStrings(connectionInfo, poolingInfo, {
        projectRef,
        usePoolerConnection,
      })
    : { uri: '', psql: '', golang: '', jdbc: '', dotnet: '', nodejs: '', php: '', python: '' }
  const poolerTld = isSuccessPoolingInfo ? getPoolerTld(poolingInfo.connectionString) : 'com'
  const poolerConnStringSyntax = isSuccessPoolingInfo
    ? constructConnStringSyntax(poolingInfo.connectionString, {
        selectedTab,
        usePoolerConnection,
        ref: projectRef as string,
        cloudProvider: isProjectLoading ? '' : project?.cloud_provider || '',
        region: isProjectLoading ? '' : project?.region || '',
        tld: usePoolerConnection ? poolerTld : connectionTld,
        portNumber: usePoolerConnection
          ? poolingInfo.db_port.toString()
          : connectionInfo.db_port.toString(),
      })
    : []

  useEffect(() => {
    if (
      readReplicasEnabled &&
      connectionString !== undefined &&
      connectionStringsRef.current !== undefined
    ) {
      state.setSelectedDatabaseId(connectionString)
      connectionStringsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [connectionString])

  return (
    <div id="connection-string">
      <Panel
        className="!m-0 [&>div:nth-child(1)]:!border-0 [&>div:nth-child(1)>div]:!p-0"
        title={
          <div ref={connectionStringsRef} className="w-full flex flex-col pt-4">
            <div className="flex items-center justify-between px-6 mb-2">
              <h5 key="panel-title" className="mb-0">
                Connection string
              </h5>
              <div className="flex items-center gap-x-2">
                {readReplicasEnabled && <DatabaseSelector />}
                <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  <a href="https://supabase.com/docs/guides/database/connecting-to-postgres">
                    Documentation
                  </a>
                </Button>
              </div>
            </div>
            <Tabs
              type="underlined"
              size="tiny"
              activeId={selectedTab}
              baseClassNames="!space-y-0 px-6 -mb-[1px]"
              onChange={setSelectedTab}
            >
              {CONNECTION_TYPES.map((type) => (
                <Tabs.Panel key={type.id} id={type.id} label={type.label} />
              ))}
            </Tabs>
            <Separator />
          </div>
        }
      >
        <Panel.Content>
          {isLoading && <ShimmeringLoader className="h-8 w-full" />}
          {isError && <AlertError error={error} subject="Failed to retrieve database settings" />}
          {isSuccess && (
            <div className="flex flex-col gap-y-4 pt-2">
              <UsePoolerCheckbox
                id="connection-string"
                checked={usePoolerConnection}
                onCheckedChange={setUsePoolerConnection}
              />
              {!usePoolerConnection && <IPv4DeprecationNotice />}
              <Input
                copy
                readOnly
                disabled
                className="input-mono [&>div>div>div>input]:text-xs [&>div>div>div>input]:opacity-100"
                value={connectionStrings[selectedTab]}
                onCopy={() => handleCopy(selectedTab)}
              />
              {poolerConnStringSyntax.length > 0 && poolingInfo?.supavisor_enabled && (
                <div className="flex flex-col gap-y-1 text-foreground-light">
                  <p className="text-sm">
                    You can use the following URI format to switch to a different database or user
                    {usePoolerConnection ? ' when using connection pooling' : ''}.
                  </p>
                  <p className="text-sm font-mono tracking-tight text-foreground-lighter">
                    {poolerConnStringSyntax.map((x, idx) => {
                      if (x.tooltip) {
                        return (
                          <Tooltip.Root key={`syntax-${idx}`} delayDuration={0}>
                            <Tooltip.Trigger asChild>
                              <span className="text-foreground text-xs">{x.value}</span>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Portal>
                                <Tooltip.Content side="bottom">
                                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                                  <div
                                    className={[
                                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                                      'border border-background',
                                    ].join(' ')}
                                  >
                                    <span className="text-xs text-foreground">{x.tooltip}</span>
                                  </div>
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )
                      } else {
                        return (
                          <span key={`syntax-${idx}`} className="text-xs">
                            {x.value}
                          </span>
                        )
                      }
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </Panel.Content>
      </Panel>
    </div>
  )
}
