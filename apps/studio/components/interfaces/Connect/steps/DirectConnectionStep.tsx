import { useParams } from 'common'
import { useMemo } from 'react'
import { CodeBlock, SimpleCodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { pluckObjectFields } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

import { type ConnectionStringMethod } from '../Connect.constants'
import type { ConnectState, ProjectKeys } from '../Connect.types'
import { ConnectTabContent, ConnectTabs, ConnectTabTrigger, ConnectTabTriggers } from '../ConnectTabs'
import { getConnectionStrings } from '../DatabaseSettings.utils'
import examples from '../DirectConnectionExamples'

interface DirectConnectionStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Step component for direct database connections.
 * Uses state from the schema to determine which connection string to show.
 */
export function DirectConnectionInstallStep({ state }: DirectConnectionStepProps) {
  const connectionType = (state.connectionType as string) ?? 'uri'
  const example = examples[connectionType as keyof typeof examples]
  const exampleInstallCommands = example?.installCommands ?? []

  if (exampleInstallCommands.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {exampleInstallCommands.map((cmd) => (
        <CodeBlock
          key={`example-install-command-${cmd}`}
          className="[&_code]:text-foreground"
          wrapperClassName="lg:col-span-2"
          value={cmd}
          hideLineNumbers
          language="bash"
        >
          {cmd}
        </CodeBlock>
      ))}
    </div>
  )
}

export function DirectConnectionStep({ state }: DirectConnectionStepProps) {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()

  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const connectionType = (state.connectionType as string) ?? 'uri'
  const useSharedPooler = Boolean(state.useSharedPooler)

  // For free tier, always use shared pooler
  const isFreeOrg = org?.plan?.id === 'free'

  const { data: settings, isLoading: isLoadingSettings } = useProjectSettingsV2Query({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === databaseSelectorState.selectedDatabaseId
  )
  const connectionInfo = pluckObjectFields(selectedDatabase || settings || emptyState, DB_FIELDS)
  const isReplicaSelected = selectedDatabase?.identifier !== projectRef

  // Shared pooler config (Supavisor)
  const sharedPoolerConfig = supavisorConfig?.find(
    (x) => x.identifier === databaseSelectorState.selectedDatabaseId
  )

  // Dedicated pooler config (PgBouncer) - only available for paid plans
  const dedicatedPoolerConfig = !isFreeOrg ? pgbouncerConfig : undefined

  // Get connection strings for both pooler types
  const sharedPoolerStrings = getConnectionStrings({
    connectionInfo,
    poolingInfo: {
      connectionString: sharedPoolerConfig?.connection_string ?? '',
      db_host: isReplicaSelected ? connectionInfo.db_host : sharedPoolerConfig?.db_host ?? '',
      db_name: sharedPoolerConfig?.db_name ?? '',
      db_port: sharedPoolerConfig?.db_port ?? 0,
      db_user: sharedPoolerConfig?.db_user ?? '',
    },
    metadata: { projectRef },
  })

  const dedicatedPoolerStrings = dedicatedPoolerConfig
    ? getConnectionStrings({
        connectionInfo,
        poolingInfo: {
          connectionString: isReplicaSelected
            ? dedicatedPoolerConfig.connection_string.replace(
                dedicatedPoolerConfig.db_host,
                connectionInfo.db_host
              )
            : dedicatedPoolerConfig.connection_string,
          db_host: isReplicaSelected ? connectionInfo.db_host : dedicatedPoolerConfig.db_host,
          db_name: dedicatedPoolerConfig.db_name,
          db_port: dedicatedPoolerConfig.db_port,
          db_user: dedicatedPoolerConfig.db_user,
        },
        metadata: { projectRef },
      })
    : null

  const directStrings = getConnectionStrings({
    connectionInfo,
    poolingInfo: {
      connectionString: '',
      db_host: connectionInfo.db_host,
      db_name: connectionInfo.db_name,
      db_port: connectionInfo.db_port,
      db_user: connectionInfo.db_user,
    },
    metadata: { projectRef },
  })

  // Determine which connection string to use
  const getConnectionString = useMemo(() => {
    if (connectionMethod === 'direct') {
      return directStrings.direct[connectionType] ?? directStrings.direct.uri
    }

    if (connectionMethod === 'session') {
      // Session mode always uses shared pooler (port 5432)
      return sharedPoolerStrings.pooler[connectionType]?.replace('6543', '5432') ?? 
             sharedPoolerStrings.pooler.uri.replace('6543', '5432')
    }

    // Transaction pooler
    if (isFreeOrg || useSharedPooler || !dedicatedPoolerStrings) {
      // Use shared pooler
      return sharedPoolerStrings.pooler[connectionType] ?? sharedPoolerStrings.pooler.uri
    }

    // Use dedicated pooler
    return dedicatedPoolerStrings.pooler[connectionType] ?? dedicatedPoolerStrings.pooler.uri
  }, [
    connectionMethod,
    connectionType,
    useSharedPooler,
    isFreeOrg,
    directStrings,
    sharedPoolerStrings,
    dedicatedPoolerStrings,
  ])

  const example = examples[connectionType as keyof typeof examples]
  const exampleFiles = example?.files

  if (isLoadingSettings) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const envContent = `DATABASE_URL="${getConnectionString}"`
  const files = [
    {
      name: '.env',
      content: envContent,
      language: 'bash',
    },
    ...(exampleFiles ?? []).map((file) => ({
      name: file.name,
      content: file.content,
      language: getLanguageFromFileName(file.name),
    })),
  ]

  return (
    <div className="flex flex-col gap-6">
      {files.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <ConnectTabs>
            <ConnectTabTriggers>
              {files.map((file) => (
                <ConnectTabTrigger key={`direct-file-${file.name}`} value={file.name} />
              ))}
            </ConnectTabTriggers>

            {files.map((file) => (
              <ConnectTabContent key={`direct-file-content-${file.name}`} value={file.name}>
                <SimpleCodeBlock
                  className={file.language}
                  parentClassName="min-h-72"
                  showCopy={true}
                >
                  {file.content}
                </SimpleCodeBlock>
              </ConnectTabContent>
            ))}
          </ConnectTabs>
        </div>
      )}
    </div>
  )
}
function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'js':
      return 'js'
    case 'jsx':
      return 'jsx'
    case 'ts':
      return 'ts'
    case 'tsx':
      return 'tsx'
    case 'go':
      return 'go'
    case 'py':
      return 'python'
    case 'kt':
      return 'kotlin'
    case 'cs':
      return 'csharp'
    default:
      return 'bash'
  }
}

