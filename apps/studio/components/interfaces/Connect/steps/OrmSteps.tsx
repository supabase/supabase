import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { CodeBlock } from 'ui'

import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { pluckObjectFields } from 'lib/helpers'

import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import type { ConnectState, ContentFileProps, ProjectKeys } from '../Connect.types'
import { getConnectionStrings } from '../DatabaseSettings.utils'

interface OrmStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

const ORM_INSTALL_COMMANDS: Record<string, string[]> = {
  prisma: ['npm install prisma --save-dev', 'npx prisma init'],
  drizzle: ['npm install drizzle-orm', 'npm install drizzle-kit --save-dev'],
}

export function OrmInstallStep({ state }: OrmStepProps) {
  const ormKey = String(state.orm ?? '')
  const commands = ORM_INSTALL_COMMANDS[ormKey]

  if (!commands?.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {commands.map((cmd, index) => (
        <CodeBlock
          key={index}
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

export function OrmContentStep({ state, projectKeys }: OrmStepProps) {
  const ormKey = String(state.orm ?? '')
  const { ref: projectRef } = useParams()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const allowPgBouncerSelection = useMemo(
    () => selectedOrg?.plan.id !== 'free',
    [selectedOrg]
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
  const poolingConfigurationShared = supavisorConfig?.find(
    (x) => x.database_type === 'PRIMARY'
  )
  const poolingConfigurationDedicated = allowPgBouncerSelection
    ? pgbouncerConfig
    : undefined

  const connectionStringsShared = getConnectionStrings({
    connectionInfo,
    poolingInfo: {
      connectionString: poolingConfigurationShared?.connection_string ?? '',
      db_host: poolingConfigurationShared?.db_host ?? '',
      db_name: poolingConfigurationShared?.db_name ?? '',
      db_port: poolingConfigurationShared?.db_port ?? 0,
      db_user: poolingConfigurationShared?.db_user ?? '',
    },
    metadata: { projectRef },
  })

  const connectionStringsDedicated =
    poolingConfigurationDedicated !== undefined
      ? getConnectionStrings({
          connectionInfo,
          poolingInfo: {
            connectionString: poolingConfigurationDedicated.connection_string,
            db_host: poolingConfigurationDedicated.db_host,
            db_name: poolingConfigurationDedicated.db_name,
            db_port: poolingConfigurationDedicated.db_port,
            db_user: poolingConfigurationDedicated.db_user,
          },
          metadata: { projectRef },
        })
      : undefined

  const connectionStringPooler = {
    transactionShared: connectionStringsShared.pooler.uri,
    sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
    transactionDedicated: connectionStringsDedicated?.pooler.uri,
    sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
    ipv4SupportedForDedicatedPooler: !!ipv4Addon,
    direct: connectionStringsShared.direct.uri,
  }

  const ContentFile = useMemo(() => {
    if (!ormKey) return null

    return dynamic<ContentFileProps>(() => import(`../content/${ormKey}/content`), {
      loading: () => (
        <div className="p-4 min-h-[200px]">
          <GenericSkeletonLoader />
        </div>
      ),
    })
  }, [ormKey])

  if (!ContentFile) {
    return null
  }

  const contentFileProjectKeys = {
    apiUrl: projectKeys.apiUrl ?? '',
    anonKey: projectKeys.anonKey ?? undefined,
    publishableKey: projectKeys.publishableKey ?? undefined,
  }

  return (
    <div className="border rounded-lg">
      <ContentFile
        projectKeys={contentFileProjectKeys}
        connectionStringPooler={connectionStringPooler}
        connectionTab="ORMs"
      />
    </div>
  )
}
