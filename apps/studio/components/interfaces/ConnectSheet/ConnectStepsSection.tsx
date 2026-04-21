import { useParams } from 'common'
import dynamic from 'next/dynamic'
import { useMemo, useRef, type ComponentType } from 'react'
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
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { pluckObjectFields } from '@/lib/helpers'

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
  const { hasAccess: allowPgBouncerSelection } = useCheckEntitlements('dedicated_pooler')

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

// Vite needs `import.meta.glob` to statically discover the step content
// modules because the `${filePath}` template can span multiple directory
// segments (`flask/supabasepy`, `steps/shadcn/explore`, ...) which Vite's
// dynamic-import-vars plugin can't analyze. Skip the glob on the SSR bundle
// — Vite replaces `import.meta.env.SSR` at build time and tree-shakes the
// call so the 37 content modules stay out of the server graph (pulling them
// in reshuffles chunks enough to surface latent circular-dep bugs in
// unrelated modules). Next/webpack doesn't know about `import.meta.glob`
// either; the try/catch lets that branch fall through to the webpack-friendly
// `import()` below.
let contentModules: Record<string, () => Promise<unknown>> = {}
if (!import.meta.env?.SSR) {
  try {
    contentModules = import.meta.glob('./content/**/content.{tsx,ts}')
  } catch {
    // webpack build: import.meta.glob is undefined, keep empty map
  }
}

type StepContentModule = { default: ComponentType<StepContentProps> }

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
    const viteLoader =
      contentModules[`./content/${filePath}/content.tsx`] ??
      contentModules[`./content/${filePath}/content.ts`]

    const loader = viteLoader
      ? (viteLoader as () => Promise<StepContentModule>)
      : () =>
          import(/* @vite-ignore */ `./content/${filePath}/content`) as Promise<StepContentModule>

    return dynamic<StepContentProps>(loader, {
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
