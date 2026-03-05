import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { pluckObjectFields } from 'lib/helpers'
import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type {
  ConnectionStringPooler,
  ConnectState,
  ProjectKeys,
  ResolvedStep,
  StepContentProps,
} from './Connect.types'
import { ConnectSheetStep } from './ConnectSheetStep'
import { CopyPromptAdmonition } from './CopyPromptAdmonition'
import { getConnectionStrings } from './DatabaseSettings.utils'

interface ConnectStepsSectionProps {
  steps: ResolvedStep[]
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Resolves a content path template by replacing {{key}} placeholders with state values.
 * Empty segments are filtered out to handle optional state values like frameworkVariant.
 *
 * Examples:
 *   - '{{framework}}/{{frameworkVariant}}/{{library}}' with state {framework: 'nextjs', frameworkVariant: 'app', library: 'supabasejs'}
 *     → 'nextjs/app/supabasejs'
 *   - '{{orm}}' with state {orm: 'prisma'}
 *     → 'prisma'
 *   - 'steps/install' (no templates)
 *     → 'steps/install'
 */
function resolveContentPath(template: string, state: ConnectState): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key) => String(state[key] ?? ''))
    .split('/')
    .filter(Boolean)
    .join('/')
}

/**
 * Hook to fetch and prepare connection strings for step content.
 */
function useConnectionStringPooler(): ConnectionStringPooler {
  const { ref: projectRef } = useParams()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const allowPgBouncerSelection = useMemo(() => selectedOrg?.plan.id !== 'free', [selectedOrg])

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
  const poolingConfigurationShared = supavisorConfig?.find((x) => x.database_type === 'PRIMARY')
  const poolingConfigurationDedicated = allowPgBouncerSelection ? pgbouncerConfig : undefined

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

  return useMemo(
    () => ({
      transactionShared: connectionStringsShared.pooler.uri,
      sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
      transactionDedicated: connectionStringsDedicated?.pooler.uri,
      sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
      ipv4SupportedForDedicatedPooler: !!ipv4Addon,
      direct: connectionStringsShared.direct.uri,
    }),
    [connectionStringsShared, connectionStringsDedicated, ipv4Addon]
  )
}

/**
 * Dynamically loads and renders a content component from the content directory.
 * All step content uses this unified loader - no built-in component registry needed.
 */
function StepContent({
  contentId,
  state,
  projectKeys,
  connectionStringPooler,
}: {
  contentId: string
  state: ConnectState
  projectKeys: ProjectKeys
  connectionStringPooler: ConnectionStringPooler
}) {
  // Resolve any template placeholders in the content path
  const filePath = useMemo(() => resolveContentPath(contentId, state), [contentId, state])

  // Dynamically import the content component
  const ContentComponent = useMemo(() => {
    return dynamic<StepContentProps>(() => import(`./content/${filePath}/content`), {
      loading: () => (
        <div className="p-4 min-h-[200px]">
          <GenericSkeletonLoader />
        </div>
      ),
    })
  }, [filePath])

  return (
    <ContentComponent
      state={state}
      projectKeys={projectKeys}
      connectionStringPooler={connectionStringPooler}
    />
  )
}

export function ConnectStepsSection({ steps, state, projectKeys }: ConnectStepsSectionProps) {
  const stepsContainerRef = useRef<HTMLDivElement | null>(null)
  const connectionStringPooler = useConnectionStringPooler()

  if (steps.length === 0) return null

  return (
    <div className="bg-muted/50 flex-1">
      <div className="p-8 flex flex-col gap-y-6">
        <h3>Connect your app</h3>

        <CopyPromptAdmonition stepsContainerRef={stepsContainerRef} />

        <div className="mt-6" ref={stepsContainerRef}>
          {steps.map((step, index) => (
            <ConnectSheetStep
              key={step.id}
              number={index + 1}
              title={step.title}
              description={step.description}
            >
              <StepContent
                contentId={step.content}
                state={state}
                projectKeys={projectKeys}
                connectionStringPooler={connectionStringPooler}
              />
            </ConnectSheetStep>
          ))}
        </div>
      </div>
    </div>
  )
}
