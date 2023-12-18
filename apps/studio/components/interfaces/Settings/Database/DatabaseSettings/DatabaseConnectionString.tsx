import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { Input, Tabs } from 'ui'

import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'

import { useFlag } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Telemetry from 'lib/telemetry'

const DatabaseConnectionString = () => {
  const router = useRouter()
  const { ref: projectRef, connectionString } = useParams()
  const telemetryProps = useTelemetryProps()

  const readReplicasEnabled = useFlag('readReplicas')
  const connectionStringsRef = useRef<HTMLDivElement>(null)

  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>(projectRef ?? '')

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

  const selectedDatabase = (databases ?? []).find((db) => db.identifier === selectedDatabaseId)

  const { project } = data ?? {}
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = readReplicasEnabled
    ? pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)
    : pluckObjectFields(project || emptyState, DB_FIELDS)

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
  const uriConnString =
    `postgresql://${connectionInfo.db_user}:[YOUR-PASSWORD]@` +
    `${connectionInfo.db_host}:${connectionInfo.db_port.toString()}` +
    `/${connectionInfo.db_name}`
  const golangConnString =
    `user=${connectionInfo.db_user} password=[YOUR-PASSWORD] ` +
    `host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
    ` dbname=${connectionInfo.db_name}`
  const psqlConnString =
    `psql -h ${connectionInfo.db_host} -p ` +
    `${connectionInfo.db_port.toString()} -d ${connectionInfo.db_name} ` +
    `-U ${connectionInfo.db_user}`

  useEffect(() => {
    if (connectionString !== undefined && connectionStringsRef.current !== undefined) {
      setSelectedDatabaseId(connectionString)
      connectionStringsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [connectionString])

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <Panel
          title={
            <div ref={connectionStringsRef} className="w-full flex items-center justify-between">
              <h5 key="panel-title" className="mb-0">
                Connection string
              </h5>
              {readReplicasEnabled && (
                <DatabaseSelector
                  selectedDatabaseId={selectedDatabaseId}
                  onChangeDatabaseId={setSelectedDatabaseId}
                />
              )}
            </div>
          }
          className="!m-0"
        >
          <Panel.Content>
            {isLoading && <ShimmeringLoader className="h-8 w-full" />}
            {isError && <AlertError error={error} subject="Failed to retrieve database settings" />}
            {isSuccess && (
              <Tabs type="underlined" size="small">
                <Tabs.Panel id="psql" label="PSQL">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={psqlConnString}
                    onCopy={() => {
                      handleCopy('PSQL')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="uri" label="URI">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={uriConnString}
                    onCopy={() => {
                      handleCopy('URI')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="golang" label="Golang">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={golangConnString}
                    onCopy={() => {
                      handleCopy('Golang')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="jdbc" label="JDBC">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `jdbc:postgresql://${
                        connectionInfo.db_host
                      }:${connectionInfo.db_port.toString()}` +
                      `/${connectionInfo.db_name}?user=${connectionInfo.db_user}&password=[YOUR-PASSWORD]`
                    }
                    onCopy={() => {
                      handleCopy('JDBC')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="dotnet" label=".NET">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `User Id=${connectionInfo.db_user};Password=[YOUR-PASSWORD];` +
                      `Server=${
                        connectionInfo.db_host
                      };Port=${connectionInfo.db_port.toString()};` +
                      `Database=${connectionInfo.db_name}`
                    }
                    onCopy={() => {
                      handleCopy('.NET')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="nodejs" label="Nodejs">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={uriConnString}
                    onCopy={() => {
                      handleCopy('Nodejs')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="php" label="PHP">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={golangConnString}
                    onCopy={() => {
                      handleCopy('PHP')
                    }}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="python" label="Python">
                  <Input
                    copy
                    readOnly
                    disabled
                    value={
                      `user=${connectionInfo.db_user} password=[YOUR-PASSWORD]` +
                      ` host=${connectionInfo.db_host} port=${connectionInfo.db_port.toString()}` +
                      ` database=${connectionInfo.db_name}`
                    }
                    onCopy={() => {
                      handleCopy('Python')
                    }}
                  />
                </Tabs.Panel>
              </Tabs>
            )}
          </Panel.Content>
        </Panel>
      </section>
    </div>
  )
}

export default DatabaseConnectionString
