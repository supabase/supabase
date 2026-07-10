import { useParams } from 'common'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useRef, type ComponentType } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type {
  ConnectionStringPooler,
  ConnectState,
  DeploymentMode,
  ProjectKeys,
  ResolvedStep,
  StepContentProps,
} from './Connect.types'
import { ConnectSheetStep } from './ConnectSheetStep'
import {
  resolveContentPath,
  shouldFetchDataApiConfig,
  shouldShowDataApiDisabledWarning,
  shouldShowIpv4AddonNotice,
  shouldShowSelfHostedMcpNotice,
  shouldShowSessionPoolerNotice,
} from './ConnectStepsSection.utils'
import { CopyPromptAdmonition } from './CopyPromptAdmonition'
import { buildConnectionStringPooler, getConnectionStrings } from './DatabaseSettings.utils'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { DocsButton } from '@/components/ui/DocsButton'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from '@/data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { DOCS_URL } from '@/lib/constants'
import { pluckObjectFields } from '@/lib/helpers'

interface ConnectStepsSectionProps {
  steps: ResolvedStep[]
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Hook to fetch and prepare connection strings for step content.
 */
function useConnectionStringPooler(deploymentMode: DeploymentMode): ConnectionStringPooler {
  const { ref: projectRef } = useParams()
  const { hasAccess: allowPgBouncerSelection } = useCheckEntitlements('dedicated_pooler')

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  // Each intermediate derived value is memoized so its reference stays stable
  // across renders while the upstream query data is unchanged. Without this,
  // pluckObjectFields / getConnectionStrings would mint fresh objects every
  // render and invalidate the final useMemo on each tick (and ripple through
  // every consumer that lists ConnectionStringPooler in their own deps).
  const connectionInfo = useMemo(() => {
    const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
    const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
    return pluckObjectFields(settings || emptyState, DB_FIELDS)
  }, [settings])

  const poolingConfigurationShared = supavisorConfig?.find((x) => x.database_type === 'PRIMARY')
  const poolingConfigurationDedicated = allowPgBouncerSelection ? pgbouncerConfig : undefined

  const connectionStringsShared = useMemo(
    () =>
      getConnectionStrings({
        connectionInfo,
        poolingInfo: {
          connectionString: poolingConfigurationShared?.connection_string ?? '',
          db_host: poolingConfigurationShared?.db_host ?? '',
          db_name: poolingConfigurationShared?.db_name ?? '',
          db_port: poolingConfigurationShared?.db_port ?? 0,
          db_user: poolingConfigurationShared?.db_user ?? '',
        },
        metadata: { projectRef },
      }),
    [connectionInfo, poolingConfigurationShared, projectRef]
  )

  const connectionStringsDedicated = useMemo(
    () =>
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
        : undefined,
    [connectionInfo, poolingConfigurationDedicated, projectRef]
  )

  return useMemo(
    () =>
      buildConnectionStringPooler({
        deploymentMode,
        connectionInfo,
        connectionStringsShared,
        connectionStringsDedicated,
        ipv4Addon: !!ipv4Addon,
      }),
    [deploymentMode, connectionInfo, connectionStringsShared, connectionStringsDedicated, ipv4Addon]
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
  deploymentMode,
}: {
  contentId: string
  state: ConnectState
  projectKeys: ProjectKeys
  connectionStringPooler: ConnectionStringPooler
  deploymentMode: DeploymentMode
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
      deploymentMode={deploymentMode}
    />
  )
}

export function ConnectStepsSection({ steps, state, projectKeys }: ConnectStepsSectionProps) {
  const { ref } = useParams()
  const stepsContainerRef = useRef<HTMLDivElement | null>(null)
  const deploymentMode = useDeploymentMode()
  const connectionStringPooler = useConnectionStringPooler(deploymentMode)

  const { data: ipv4Addon } = useProjectAddonsQuery(
    { projectRef: ref },
    {
      select: (data) => {
        const selectedAddons = data?.selected_addons ?? []
        return selectedAddons.find((addon) => addon.type === 'ipv4')
      },
    }
  )
  const showIpv4AddonNotice = shouldShowIpv4AddonNotice({
    isPlatform: deploymentMode.isPlatform,
    mode: state.mode,
    connectionMethod: state.connectionMethod,
    useSharedPooler: state.useSharedPooler,
    hasIpv4Addon: !!ipv4Addon,
  })
  const showSessionPoolerNotice = shouldShowSessionPoolerNotice({
    isPlatform: deploymentMode.isPlatform,
    mode: state.mode,
    connectionMethod: state.connectionMethod,
  })
  const showSelfHostedMcpNotice = shouldShowSelfHostedMcpNotice({
    isSelfHosted: deploymentMode.isSelfHosted,
    mode: state.mode,
  })

  const shouldFetchDataApiStatus = shouldFetchDataApiConfig({
    mode: state.mode,
  })
  const {
    isEnabled: isDataApiEnabled,
    isPending: isDataApiConfigPending,
    isError: isDataApiConfigError,
  } = useIsDataApiEnabled({
    projectRef: ref,
    enabled: shouldFetchDataApiStatus,
  })
  const showDataApiDisabledWarning = shouldShowDataApiDisabledWarning({
    mode: state.mode,
    isDataApiEnabled,
    isPending: isDataApiConfigPending,
    isError: isDataApiConfigError,
  })
  if (steps.length === 0) return null

  return (
    <div className="bg-muted/50 flex-1">
      <div className="p-8 flex flex-col gap-y-6">
        <h3>Connect your app</h3>

        {showDataApiDisabledWarning && (
          <Admonition
            type="warning"
            layout="responsive"
            title="Database access requires the Data API"
            description="Client library database queries will not work until the Data API is enabled."
            actions={[
              <Button asChild key="enable" variant="default">
                <Link href={`/project/${ref}/integrations/data_api`}>Enable Data API</Link>
              </Button>,
            ]}
          />
        )}

        {showIpv4AddonNotice && (
          <Admonition
            type="default"
            title={`${state.connectionMethod === 'direct' ? 'Direct connections use' : 'Transaction pooler uses'} IPv6 by default`}
            description="Enable the dedicated IPv4 address add-on to connect from IPv4-only networks"
            actions={[
              <Button asChild key="addon" variant="default">
                <Link href={`/project/${ref}/settings/addons?panel=ipv4`}>Enable IPv4 add-on</Link>
              </Button>,
              <DocsButton key="docs" href={`${DOCS_URL}/guides/platform/ipv4-address`} />,
            ]}
          />
        )}

        {showSessionPoolerNotice && (
          <Admonition
            type="default"
            title="Only use Session Pooler on an IPv4 network"
            description="Session pooler connections are IPv4 proxied for free. Use Direct Connection if connecting via an IPv6 network."
          />
        )}

        {showSelfHostedMcpNotice && (
          <Admonition
            type="default"
            title="MCP for self-hosted Supabase requires extra setup"
            description="The configuration below points at the hosted Supabase MCP server. To use MCP against your self-hosted instance, follow the self-hosted MCP guide."
            actions={[
              <DocsButton
                key="docs"
                href="https://supabase.com/docs/guides/self-hosting/enable-mcp"
              />,
            ]}
          />
        )}

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
                deploymentMode={deploymentMode}
              />
            </ConnectSheetStep>
          ))}
        </div>
      </div>
    </div>
  )
}
