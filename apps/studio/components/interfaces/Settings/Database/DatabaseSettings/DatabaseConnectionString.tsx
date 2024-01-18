import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Input, Separator, Tabs } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useFlag } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { getConnectionStrings } from './DatabaseSettings.utils'

const CONNECTION_TYPES = [
  { id: 'psql', label: 'PSQL' },
  { id: 'uri', label: 'URI' },
  { id: 'golang', label: 'Golang' },
  { id: 'jdbc', label: 'JDBC' },
  { id: 'dotnet', label: '.NET' },
  { id: 'nodejs', label: 'Nodejs' },
  { id: 'php', label: 'PHP' },
  { id: 'python', label: 'Python' },
]

export const DatabaseConnectionString = () => {
  const router = useRouter()
  const { project: projectDetails } = useProjectContext()
  const { ref: projectRef, connectionString } = useParams()
  const telemetryProps = useTelemetryProps()
  const state = useDatabaseSelectorStateSnapshot()

  const readReplicasEnabled = useFlag('readReplicas') && projectDetails?.is_read_replicas_enabled
  const connectionStringsRef = useRef<HTMLDivElement>(null)
  const [selectedTab, setSelectedTab] = useState<
    'psql' | 'uri' | 'golang' | 'jdbc' | 'dotnet' | 'nodejs' | 'php' | 'python'
  >('psql')

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

  const connectionStrings = getConnectionStrings(connectionInfo)

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
      <div ref={connectionStringsRef} className="flex flex-col py-4">
        <div className="px-6 mb-2">
          <h5 key="panel-title" className="mb-0">
            Connection string
          </h5>
          {readReplicasEnabled && <DatabaseSelector />}
        </div>
        <Tabs
          type="underlined"
          size="tiny"
          activeId={selectedTab}
          baseClassNames="!space-y-0 -mb-[1px] px-6"
          onChange={setSelectedTab}
        >
          {CONNECTION_TYPES.map((type) => (
            <Tabs.Panel key={type.id} id={type.id} label={type.label} />
          ))}
        </Tabs>
        <Separator />
      </div>

      <div className="px-6 pb-4">
        {isLoading && <ShimmeringLoader className="h-8 w-full" />}
        {isError && <AlertError error={error} subject="Failed to retrieve database settings" />}
        {isSuccess && (
          <Input
            copy
            readOnly
            disabled
            value={connectionStrings[selectedTab]}
            onCopy={() => handleCopy(selectedTab)}
          />
        )}
      </div>
    </div>
  )
}
