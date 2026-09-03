import { Check, KeyRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input as CopyableInput } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  CONNECTION_SOURCE_LOAD_BALANCER,
  DATABASE_CONNECTION_TYPES,
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '@/components/interfaces/ConnectSheet/Connect.constants'
import type {
  ConnectionStringPooler,
  StepContentProps,
} from '@/components/interfaces/ConnectSheet/Connect.types'
import { ConnectionParameters } from '@/components/interfaces/ConnectSheet/ConnectionParameters'
import {
  buildConnectionParameters,
  buildConnectionStringWithPassword,
  buildJdbcString,
  buildPsqlCommand,
  buildSafeConnectionString,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
} from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { PasswordEncodingNote } from '@/components/interfaces/ConnectSheet/PasswordEncodingNote'
import { useConnectionStringDatabases } from '@/components/interfaces/ConnectSheet/useConnectionStringDatabases'
import { ResetDbPasswordDialog } from '@/components/interfaces/Settings/Database/DatabaseSettings/ResetDbPasswordDialog'
import {
  PRIVATE_LINK_PREVIEW_HOSTNAME,
  usePrivateLinkPreview,
} from '@/components/interfaces/Settings/Integrations/AWSPrivateLink/preview'
import { InlineLink } from '@/components/ui/InlineLink'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

const CONNECTION_METHOD_TO_TELEMETRY: Record<
  ConnectionStringMethod,
  'direct' | 'transaction_pooler' | 'session_pooler'
> = {
  direct: 'direct',
  transaction: 'transaction_pooler',
  session: 'session_pooler',
}

/**
 * Step component for direct database connections.
 * Uses state to determine which connection string to show.
 */
function DirectConnectionContent({ state, deploymentMode }: StepContentProps) {
  const track = useTrack()
  const { hasAccess: hasDedicatedPooler } = useCheckEntitlements('dedicated_pooler')
  const isHighAvailability = useIsHighAvailability()
  const { showPrivateHostname } = usePrivateLinkPreview()
  const [temporaryDatabasePassword, setTemporaryDatabasePassword] = useState('')

  const connectionSource = state.connectionSource
  const isLoadBalancerSelected =
    isHighAvailability && connectionSource === CONNECTION_SOURCE_LOAD_BALANCER
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  const connectionStrings = useConnectionStringDatabases(deploymentMode)
  const connectionStringPooler: ConnectionStringPooler | undefined =
    connectionStrings[connectionSource as keyof typeof connectionStrings]
  // Determine which connection string to use
  const resolvedConnectionString = useMemo(
    () =>
      resolveConnectionString({
        connectionMethod,
        useSharedPooler,
        connectionStringPooler,
      }),
    [connectionMethod, useSharedPooler, connectionStringPooler]
  )

  const connectionParams = useMemo(
    () => parseConnectionParams(resolvedConnectionString),
    [resolvedConnectionString]
  )

  const safeConnectionString = useMemo(
    () => buildSafeConnectionString(resolvedConnectionString, connectionParams),
    [resolvedConnectionString, connectionParams]
  )

  const redactedConnectionString = useMemo(() => {
    switch (connectionType) {
      case 'psql':
        return buildPsqlCommand(connectionParams)
      case 'jdbc':
        return buildJdbcString(connectionParams)
      case 'php':
        return `DATABASE_URL=${safeConnectionString}`
      case 'uri':
      default:
        return safeConnectionString
    }
  }, [connectionType, connectionParams, safeConnectionString])

  const connectionString = useMemo(() => {
    if (!temporaryDatabasePassword) return redactedConnectionString

    if (connectionType === 'psql') {
      return redactedConnectionString
    }

    return buildConnectionStringWithPassword(redactedConnectionString, temporaryDatabasePassword)
  }, [connectionType, redactedConnectionString, temporaryDatabasePassword])

  const trackCopy = () => {
    const typeConfig = DATABASE_CONNECTION_TYPES.find((t) => t.id === connectionType)
    track('connection_string_copied', {
      connectionType: typeConfig?.label ?? connectionType,
      lang: typeConfig?.lang ?? 'bash',
      connectionMethod: CONNECTION_METHOD_TO_TELEMETRY[connectionMethod],
      connectionTab: 'Connection String',
      source: 'studio',
    })
  }

  if (!resolvedConnectionString) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const poolerBadge =
    connectionMethod === 'transaction'
      ? useSharedPooler || !hasDedicatedPooler
        ? 'Shared pooler'
        : 'Dedicated pooler'
      : connectionMethod === 'session'
        ? 'Shared pooler'
        : null

  const showPasswordPlaceholder = connectionString.includes(PASSWORD_PLACEHOLDER)
  const showSelfHostedDirectNotice = deploymentMode.isSelfHosted && connectionMethod === 'direct'
  const showPoolerTitle = deploymentMode.isPlatform && !!poolerBadge && !isHighAvailability
  const titleBadge = isLoadBalancerSelected ? 'Read-only' : poolerBadge
  const showTitleBadge = isLoadBalancerSelected || showPoolerTitle
  const showResetInTitle =
    deploymentMode.isPlatform && showPasswordPlaceholder && !temporaryDatabasePassword
  const showStringTitleRow = showTitleBadge || showResetInTitle

  return (
    <div className="flex flex-col gap-3">
      {showPrivateHostname && (
        <Admonition
          type="note"
          title="Private hostname"
          description="Use this hostname on the PrivateLink path. Vercel may inject it for you; this is the Studio-owned variant."
        >
          <CopyableInput readOnly copy value={PRIVATE_LINK_PREVIEW_HOSTNAME} />
        </Admonition>
      )}
      <div className="overflow-hidden rounded-lg border bg-surface-75">
        {showStringTitleRow && (
          <div className="flex items-center justify-between gap-2 border-b bg-surface-100 py-2 pl-4 pr-2">
            {showTitleBadge ? (
              <span className="text-xs text-foreground-light">{titleBadge}</span>
            ) : (
              <span />
            )}
            {showResetInTitle && (
              <ResetDbPasswordDialog
                triggerLabel="Reset database password"
                triggerIcon={<KeyRound />}
                onPasswordReset={setTemporaryDatabasePassword}
              />
            )}
          </div>
        )}
        <div data-connect-copy-value={redactedConnectionString}>
          <CodeBlock
            className="rounded-none border-0 [&_code]:text-foreground"
            wrapperClassName="lg:col-span-2"
            value={connectionString}
            hideLineNumbers
            language="bash"
            onCopyCallback={trackCopy}
          >
            {connectionString}
          </CodeBlock>
        </div>
        {deploymentMode.isPlatform && temporaryDatabasePassword && (
          <div className="flex items-center gap-2 border-t px-4 py-3 text-sm text-foreground-light">
            <Check size={16} className="text-brand shrink-0" />
            <span>New password shown until refresh.</span>
          </div>
        )}
      </div>
      {showPasswordPlaceholder && <PasswordEncodingNote />}
      {/* Persistent live region so screen readers announce the read-only state
          when the load balancer is selected */}
      <p
        role="status"
        className={cn('text-sm text-foreground-lighter', !isLoadBalancerSelected && 'sr-only')}
      >
        {isLoadBalancerSelected &&
          'Replica connections are read-only. Connect to the primary database for writes.'}
      </p>
      {showSelfHostedDirectNotice && (
        <p className="text-sm text-foreground-lighter">
          Manually{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/self-hosting/accessing-postgres#expose-postgres-for-direct-connections`}
          >
            configurable
          </InlineLink>{' '}
          for self-hosted Supabase.
        </p>
      )}
      <ConnectionParameters
        parameters={buildConnectionParameters(connectionParams)}
        onCopy={trackCopy}
      />
    </div>
  )
}

export default DirectConnectionContent
