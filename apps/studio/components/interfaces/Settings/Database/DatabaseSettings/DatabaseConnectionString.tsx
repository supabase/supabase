import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconExternalLink,
  Input,
  Tabs,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import Panel from 'components/ui/Panel'
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
    <div className="space-y-10">
      <section className="space-y-6">
        <Panel
          className="!m-0 [&>div:nth-child(1)>div]:!pb-0"
          title={
            <div ref={connectionStringsRef} className="flex flex-col gap-y-2">
              <div className="w-full flex items-center justify-between">
                <h5 key="panel-title" className="mb-0">
                  Connection string
                </h5>
                {readReplicasEnabled && <DatabaseSelector />}
              </div>
              <Tabs
                type="underlined"
                size="tiny"
                activeId={selectedTab}
                baseClassNames="!space-y-0 -mb-[1px]"
                onChange={setSelectedTab}
              >
                {CONNECTION_TYPES.map((type) => (
                  <Tabs.Panel key={type.id} id={type.id} label={type.label} />
                ))}
              </Tabs>
            </div>
          }
        >
          <Panel.Content>
            {isLoading && <ShimmeringLoader className="h-8 w-full" />}
            {isError && <AlertError error={error} subject="Failed to retrieve database settings" />}
            {isSuccess && (
              <div className="flex flex-col gap-y-4">
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Direct database access via IPv4 and pgBouncer will be deprecated from January
                    26th 2024
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="space-y-3">
                    <p>
                      We strongly recommend using{' '}
                      <a
                        href="https://github.com/supabase/supavisor"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground underline underline-offset-[4px] decoration-brand-500 hover:decoration-foreground"
                      >
                        Supavisor
                      </a>{' '}
                      to connect to your database. You'll only need to change the connection string
                      that you're using in your application to the pooler's connection string which
                      can be found in the connection pooling settings{' '}
                      <span
                        tabIndex={0}
                        className="cursor-pointer text-foreground underline underline-offset-[4px] decoration-brand-500 hover:decoration-foreground"
                        onClick={() => {
                          const connectionPooler = document.getElementById('connection-pooler')
                          connectionPooler?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }}
                      >
                        here
                      </span>
                      .
                    </p>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a
                        href="https://github.com/orgs/supabase/discussions/17817"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Learn more
                      </a>
                    </Button>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <Input
                  copy
                  readOnly
                  disabled
                  value={connectionStrings[selectedTab]}
                  onCopy={() => handleCopy(selectedTab)}
                />
              </div>
            )}
          </Panel.Content>
        </Panel>
      </section>
    </div>
  )
}
