import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useFlag, useSelectedProject } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertCircle,
  Input,
} from 'ui'
import { IPv4DeprecationNotice } from '../IPv4DeprecationNotice'
import { UsePoolerCheckbox } from '../UsePoolerCheckbox'
import ResetDbPassword from './ResetDbPassword'

const DatabaseSettings = () => {
  const router = useRouter()
  const { ref: projectRef, connectionString } = useParams()
  const telemetryProps = useTelemetryProps()
  const state = useDatabaseSelectorStateSnapshot()
  const selectedProject = useSelectedProject()

  const readReplicasEnabled = useFlag('readReplicas')
  const showReadReplicasUI = readReplicasEnabled && selectedProject?.is_read_replicas_enabled
  const connectionStringsRef = useRef<HTMLDivElement>(null)
  const [usePoolerConnection, setUsePoolerConnection] = useState(true)
  const [poolingMode, setPoolingMode] = useState<'transaction' | 'session' | 'statement'>('session')

  const {
    data: poolingInfo,
    error: poolingInfoError,
    isLoading: isLoadingPoolingInfo,
    isError: isErrorPoolingInfo,
    isSuccess: isSuccessPoolingInfo,
  } = usePoolingConfigurationQuery({
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
  const error = showReadReplicasUI ? readReplicasError : projectSettingsError || poolingInfoError
  const isLoading = showReadReplicasUI
    ? isLoadingReadReplicas
    : isLoadingProjectSettings || isLoadingPoolingInfo
  const isError = showReadReplicasUI
    ? isErrorReadReplicas
    : isErrorProjectSettings || isErrorPoolingInfo
  const isSuccess = showReadReplicasUI
    ? isSuccessReadReplicas
    : isSuccessProjectSettings && isSuccessPoolingInfo

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )
  const isMd5 = poolingInfo?.connectionString.includes('?options=reference')

  const { project } = data ?? {}
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const dbConnectionInfo = showReadReplicasUI
    ? pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)
    : pluckObjectFields(project || emptyState, DB_FIELDS)

  const connectionInfo = usePoolerConnection
    ? {
        db_host: poolingInfo?.db_host,
        db_name: poolingInfo?.db_name,
        db_port: poolingInfo?.db_port,
        db_user: poolingInfo?.db_user,
      }
    : dbConnectionInfo

  const handleCopy = (labelValue?: string) =>
    Telemetry.sendEvent(
      {
        category: 'settings',
        action: 'copy_connection_string',
        label: labelValue ? labelValue : '',
      },
      telemetryProps,
      router
    )

  useEffect(() => {
    if (connectionString !== undefined && connectionStringsRef.current !== undefined) {
      state.setSelectedDatabaseId(connectionString)
      connectionStringsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [connectionString])

  useEffect(() => {
    if (poolingInfo?.pool_mode === 'session') {
      setPoolingMode(poolingInfo.pool_mode)
    }
  }, [poolingInfo?.pool_mode])

  return (
    <>
      <section id="direct-connection">
        <Panel
          className="!m-0"
          title={
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <h5 className="mb-0">Connection parameters</h5>
              </div>
              {showReadReplicasUI && <DatabaseSelector />}
            </div>
          }
        >
          <Panel.Content className="space-y-6">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full"
                >
                  <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                  <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                </div>
              ))}
            {isError && <AlertError error={error} subject="Failed to retrieve databases" />}
            {isSuccess && (
              <>
                <div className="space-y-4">
                  <UsePoolerCheckbox
                    id="connection-params"
                    checked={usePoolerConnection}
                    poolingMode={poolingMode}
                    onCheckedChange={setUsePoolerConnection}
                    onSelectPoolingMode={setPoolingMode}
                  />
                  {!usePoolerConnection && <IPv4DeprecationNotice />}
                  {isMd5 && (
                    <Alert_Shadcn_>
                      <IconAlertCircle strokeWidth={2} />
                      <AlertTitle_Shadcn_>
                        If you are connecting to your database via a GUI client, use the{' '}
                        <span tabIndex={0}>connection string</span> above instead
                      </AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        GUI clients only support database connections for Postgres 13 via a
                        connection string.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                </div>
                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_host}
                  label="Host"
                  onCopy={() => {
                    handleCopy('Host')
                  }}
                />
                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_name}
                  label="Database name"
                />
                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={poolingMode === 'transaction' ? connectionInfo.db_port : '5432'}
                  label="Port"
                />
                {isMd5 && usePoolerConnection && (
                  <Input
                    className="input-mono"
                    layout="horizontal"
                    readOnly
                    copy
                    disabled
                    value={`reference=${projectRef}`}
                    label="Options"
                  />
                )}
                <Input
                  layout="horizontal"
                  className="input-mono table-input-cell text-base"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_user}
                  label="User"
                />
                <Input
                  className="input-mono"
                  layout="horizontal"
                  disabled
                  readOnly
                  value={
                    state.selectedDatabaseId !== projectRef
                      ? '[The password for your primary database]'
                      : '[The password you provided when you created this project]'
                  }
                  label="Password"
                />
              </>
            )}
          </Panel.Content>
        </Panel>
      </section>

      <ResetDbPassword disabled={isLoading || isError} />
    </>
  )
}

export default DatabaseSettings
