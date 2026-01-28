import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import AlertError from 'components/ui/AlertError'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { InlineLink } from 'components/ui/InlineLink'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import { pluckObjectFields } from 'lib/helpers'
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { HTMLAttributes, ReactNode, useEffect, useMemo, useState } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  Badge,
  Button,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  DIALOG_PADDING_X,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  cn,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  CONNECTION_PARAMETERS,
  type ConnectionStringMethod,
  DATABASE_CONNECTION_TYPES,
  DatabaseConnectionType,
  IPV4_ADDON_TEXT,
  PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT,
  connectionStringMethodOptions,
} from './Connect.constants'
import { CodeBlockFileHeader, ConnectionPanel } from './ConnectionPanel'
import { getConnectionStrings } from './DatabaseSettings.utils'
import examples, { Example } from './DirectConnectionExamples'

const StepLabel = ({
  number,
  children,
  ...props
}: { number: number; children: ReactNode } & HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={cn('flex items-center gap-2', props.className)}>
    <div className="flex font-mono text-xs items-center justify-center min-w-6 w-6 h-6 border border-strong rounded-md bg-surface-100">
      {number}
    </div>
    <span>{children}</span>
  </div>
)

/**
 * [Joshen] For paid projects - Dedicated pooler is always in transaction mode
 * So session mode connection details are always using the shared pooler (Supavisor)
 */
export const DatabaseConnectionString = () => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const state = useDatabaseSelectorStateSnapshot()

  // URL state management
  const [queryType, setQueryType] = useQueryState('type', parseAsString.withDefault('uri'))
  const [querySource, setQuerySource] = useQueryState('source', parseAsString)
  const [queryMethod, setQueryMethod] = useQueryState('method', parseAsString.withDefault('direct'))

  const [selectedTab, setSelectedTab] = useState<DatabaseConnectionType>('uri')
  const [selectedMethod, setSelectedMethod] = useState<ConnectionStringMethod>('direct')

  const sharedPoolerPreferred = useMemo(() => {
    return org?.plan?.id === 'free'
  }, [org])

  // Sync URL state with component state on mount and when URL changes
  useEffect(() => {
    const validTypes = DATABASE_CONNECTION_TYPES.map((t) => t.id)
    if (queryType && validTypes.includes(queryType as DatabaseConnectionType)) {
      setSelectedTab(queryType as DatabaseConnectionType)
    } else if (queryType && !validTypes.includes(queryType as DatabaseConnectionType)) {
      setQueryType('uri')
      setSelectedTab('uri')
    }

    const validMethods: ConnectionStringMethod[] = ['direct', 'transaction', 'session']
    if (queryMethod && validMethods.includes(queryMethod as ConnectionStringMethod)) {
      setSelectedMethod(queryMethod as ConnectionStringMethod)
    } else if (queryMethod && !validMethods.includes(queryMethod as ConnectionStringMethod)) {
      setQueryMethod('direct')
      setSelectedMethod('direct')
    }

    if (querySource && querySource !== state.selectedDatabaseId) {
      state.setSelectedDatabaseId(querySource)
    } else if (!querySource && state.selectedDatabaseId !== projectRef) {
      state.setSelectedDatabaseId(projectRef)
    }
  }, [queryType, queryMethod, querySource, state])

  // Sync component state changes back to URL
  const handleTabChange = (connectionType: DatabaseConnectionType) => {
    setSelectedTab(connectionType)
    setQueryType(connectionType)
  }

  const handleMethodChange = (method: ConnectionStringMethod) => {
    setSelectedMethod(method)
    setQueryMethod(method)
  }

  const handleDatabaseChange = (databaseId: string) => {
    if (databaseId === projectRef) {
      setQuerySource(null)
    } else {
      setQuerySource(databaseId)
    }
  }

  // Sync database selector state changes back to URL
  useEffect(() => {
    if (state.selectedDatabaseId && state.selectedDatabaseId !== querySource) {
      // Only set source in URL if it's not the primary database
      if (state.selectedDatabaseId === projectRef) {
        setQuerySource(null)
      } else {
        setQuerySource(state.selectedDatabaseId)
      }
    }
  }, [state.selectedDatabaseId, querySource, projectRef])

  const {
    data: pgbouncerConfig,
    error: pgbouncerError,
    isPending: isLoadingPgbouncerConfig,
    isError: isErrorPgbouncerConfig,
    isSuccess: isSuccessPgBouncerConfig,
  } = usePgbouncerConfigQuery({ projectRef })
  const {
    data: supavisorConfig,
    error: supavisorConfigError,
    isPending: isLoadingSupavisorConfig,
    isError: isErrorSupavisorConfig,
    isSuccess: isSuccessSupavisorConfig,
  } = useSupavisorConfigurationQuery({ projectRef })

  const {
    data: databases,
    error: readReplicasError,
    isPending: isLoadingReadReplicas,
    isError: isErrorReadReplicas,
    isSuccess: isSuccessReadReplicas,
  } = useReadReplicasQuery({ projectRef })

  const poolerError = sharedPoolerPreferred ? pgbouncerError : supavisorConfigError
  const isLoadingPoolerConfig = !IS_PLATFORM
    ? false
    : sharedPoolerPreferred
      ? isLoadingPgbouncerConfig
      : isLoadingSupavisorConfig
  const isErrorPoolerConfig = !IS_PLATFORM
    ? undefined
    : sharedPoolerPreferred
      ? isErrorPgbouncerConfig
      : isErrorSupavisorConfig
  const isSuccessPoolerConfig = !IS_PLATFORM
    ? true
    : sharedPoolerPreferred
      ? isSuccessPgBouncerConfig
      : isSuccessSupavisorConfig

  const error = poolerError || readReplicasError
  const isLoading = isLoadingPoolerConfig || isLoadingReadReplicas
  const isError = isErrorPoolerConfig || isErrorReadReplicas
  const isSuccess = isSuccessPoolerConfig && isSuccessReadReplicas

  const sharedPoolerConfig = supavisorConfig?.find((x) => x.identifier === state.selectedDatabaseId)
  const poolingConfiguration = sharedPoolerPreferred ? sharedPoolerConfig : pgbouncerConfig

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )
  const isReplicaSelected = selectedDatabase?.identifier !== projectRef

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const { mutate: sendEvent } = useSendEventMutation()

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)

  const handleCopy = (
    connectionTypeId: string,
    connectionStringMethod: 'direct' | 'transaction_pooler' | 'session_pooler'
  ) => {
    const connectionInfo = DATABASE_CONNECTION_TYPES.find((type) => type.id === connectionTypeId)
    const connectionType = connectionInfo?.label ?? 'Unknown'
    const lang = connectionInfo?.lang ?? 'Unknown'
    sendEvent({
      action: 'connection_string_copied',
      properties: {
        connectionType,
        lang,
        connectionMethod: connectionStringMethod,
        connectionTab: 'Connection String',
      },
      groups: { project: projectRef ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  const supavisorConnectionStrings = getConnectionStrings({
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

  const connectionStrings = getConnectionStrings({
    connectionInfo,
    poolingInfo: {
      connectionString: isReplicaSelected
        ? poolingConfiguration?.connection_string.replace(
            poolingConfiguration?.db_host,
            connectionInfo.db_host
          ) ?? ''
        : poolingConfiguration?.connection_string ?? '',
      db_host: isReplicaSelected ? connectionInfo.db_host : poolingConfiguration?.db_host,
      db_name: poolingConfiguration?.db_name ?? '',
      db_port: poolingConfiguration?.db_port ?? 0,
      db_user: poolingConfiguration?.db_user ?? '',
    },
    metadata: { projectRef },
  })

  const lang = DATABASE_CONNECTION_TYPES.find((type) => type.id === selectedTab)?.lang ?? 'bash'
  const contentType =
    DATABASE_CONNECTION_TYPES.find((type) => type.id === selectedTab)?.contentType ?? 'input'

  const example: Example | undefined = examples[selectedTab as keyof typeof examples]

  const exampleFiles = example?.files
  const exampleInstallCommands = example?.installCommands
  const examplePostInstallCommands = example?.postInstallCommands
  const hasCodeExamples = exampleFiles || exampleInstallCommands
  const fileTitle = DATABASE_CONNECTION_TYPES.find((type) => type.id === selectedTab)?.fileTitle

  // [Refactor] See if we can do this in an immutable way, technically not a good practice to do this
  let stepNumber = 0

  const ipv4AddOnUrl = {
    text: 'IPv4 add-on',
    url: `/project/${projectRef}/settings/addons?panel=ipv4`,
  }
  const ipv4SettingsUrl = {
    text: 'IPv4 settings',
    url: `/project/${projectRef}/settings/addons?panel=ipv4`,
  }
  const poolerSettingsUrl = {
    text: 'Pooler settings',
    url: `/project/${projectRef}/database/settings#connection-pooling`,
  }
  const buttonLinks = !ipv4Addon
    ? [ipv4AddOnUrl, ...(sharedPoolerPreferred ? [poolerSettingsUrl] : [])]
    : [ipv4SettingsUrl, ...(sharedPoolerPreferred ? [poolerSettingsUrl] : [])]
  const poolerBadge = sharedPoolerPreferred ? 'Shared Pooler' : 'Dedicated Pooler'

  return (
    <div className="flex flex-col">
      <div className={cn('w-full flex flex-col items-start gap-2 lg:gap-3', DIALOG_PADDING_X)}>
        <div className="flex w-full flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <div className="flex">
            <span className="w-1/2 md:w-auto flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
              Type
            </span>
            <Select_Shadcn_ value={selectedTab} onValueChange={handleTabChange}>
              <SelectTrigger_Shadcn_ size="small" className="w-full md:w-auto rounded-l-none">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {DATABASE_CONNECTION_TYPES.map((type) => (
                  <SelectItem_Shadcn_ key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <DatabaseSelector
            align="start"
            buttonProps={{
              size: 'small',
              className: 'w-full justify-between pr-2.5 [&_svg]:h-4',
            }}
            className="w-full md:w-auto [&>span]:w-1/2 [&>span]:md:w-auto"
            onSelectId={handleDatabaseChange}
          />
          <div className="flex">
            <span className="w-1/2 md:w-auto flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
              Method
            </span>
            <Select_Shadcn_ value={selectedMethod} onValueChange={handleMethodChange}>
              <SelectTrigger_Shadcn_ size="small" className="w-full md:w-auto rounded-l-none">
                <SelectValue_Shadcn_ size="tiny">
                  {connectionStringMethodOptions[selectedMethod].label}
                </SelectValue_Shadcn_>
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_ className="max-w-sm">
                {Object.keys(connectionStringMethodOptions).map((method) => (
                  <ConnectionStringMethodSelectItem
                    key={method}
                    method={method as ConnectionStringMethod}
                    poolerBadge={method === 'transaction' ? poolerBadge : undefined}
                  />
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        </div>
        <p className="text-xs inline-flex items-center gap-1 text-foreground-lighter">
          <BookOpen size={12} strokeWidth={1.5} className="-mb-px" /> Learn how to connect to your
          Postgres databases.
          <InlineLink
            title="Read docs"
            className="flex items-center gap-x-1"
            href={`${DOCS_URL}/guides/database/connecting-to-postgres`}
          >
            Read docs <ExternalLink size={12} strokeWidth={1.5} />
          </InlineLink>
        </p>
      </div>

      {isLoading && (
        <div className="p-7">
          <ShimmeringLoader className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <div className="p-7">
          <AlertError error={error} subject="Failed to retrieve database settings" />
        </div>
      )}

      {isSuccess && (
        <div className="flex flex-col divide-y divide-border">
          {/* // handle non terminal examples */}
          {hasCodeExamples && (
            <div className="flex flex-col w-full">
              <div className="grid lg:grid-cols-3 gap-4 lg:gap-5 py-8 px-4 md:px-7">
                <StepLabel number={++stepNumber} className="items-start">
                  Install the following
                </StepLabel>
                {exampleInstallCommands?.map((cmd) => (
                  <CodeBlock
                    key={`example-install-command-${cmd}`}
                    className="[&_code]:text-[12px] [&_code]:text-foreground"
                    wrapperClassName="lg:col-span-2"
                    value={cmd}
                    hideLineNumbers
                    language="bash"
                  >
                    {cmd}
                  </CodeBlock>
                ))}
              </div>
              {exampleFiles && exampleFiles?.length > 0 && (
                <div className="grid lg:grid-cols-3 gap-4 lg:gap-5 border-t py-8 px-4 md:px-7">
                  <StepLabel number={++stepNumber} className="items-start">
                    Add file to project
                  </StepLabel>
                  {exampleFiles?.map((file) => (
                    <div key={`example-files-${file.name}`} className="lg:col-span-2">
                      <CodeBlockFileHeader title={file.name} />
                      <CodeBlock
                        wrapperClassName="[&_pre]:max-h-40 [&_pre]:px-4 [&_pre]:py-3 [&_pre]:rounded-t-none"
                        value={file.content}
                        hideLineNumbers
                        language={lang}
                        className="[&_code]:text-[12px] [&_code]:text-foreground"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            {hasCodeExamples && (
              <div className="px-4 md:px-7 pt-8">
                <StepLabel number={++stepNumber}>Connect to your database</StepLabel>
              </div>
            )}
            <div className="px-4 md:px-7 py-8">
              {selectedMethod === 'direct' && (
                <ConnectionPanel
                  type="direct"
                  title={connectionStringMethodOptions.direct.label}
                  contentType={contentType}
                  lang={lang}
                  fileTitle={fileTitle}
                  description={connectionStringMethodOptions.direct.description}
                  connectionString={connectionStrings['direct'][selectedTab]}
                  ipv4Status={{
                    type: !ipv4Addon ? 'error' : 'success',
                    title: !ipv4Addon ? 'Not IPv4 compatible' : 'IPv4 compatible',
                    description:
                      !sharedPoolerPreferred && !ipv4Addon
                        ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
                        : sharedPoolerPreferred
                          ? 'Use Session Pooler if on a IPv4 network or purchase IPv4 add-on'
                          : IPV4_ADDON_TEXT,
                    links: buttonLinks,
                  }}
                  parameters={[
                    { ...CONNECTION_PARAMETERS.host, value: connectionInfo.db_host },
                    { ...CONNECTION_PARAMETERS.port, value: connectionInfo.db_port },
                    { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                    { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                  ]}
                  onCopyCallback={() => handleCopy(selectedTab, 'direct')}
                />
              )}

              {selectedMethod === 'transaction' && IS_PLATFORM && (
                <ConnectionPanel
                  type="transaction"
                  title={connectionStringMethodOptions.transaction.label}
                  contentType={contentType}
                  lang={lang}
                  badge={poolerBadge}
                  fileTitle={fileTitle}
                  description={connectionStringMethodOptions.transaction.description}
                  connectionString={connectionStrings['pooler'][selectedTab]}
                  ipv4Status={{
                    type: !sharedPoolerPreferred && !ipv4Addon ? 'error' : 'success',
                    title:
                      !sharedPoolerPreferred && !ipv4Addon
                        ? 'Not IPv4 compatible'
                        : 'IPv4 compatible',
                    description:
                      !sharedPoolerPreferred && !ipv4Addon
                        ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
                        : sharedPoolerPreferred
                          ? 'Transaction pooler connections are IPv4 proxied for free.'
                          : IPV4_ADDON_TEXT,
                    links: !sharedPoolerPreferred ? buttonLinks : undefined,
                  }}
                  notice={['Does not support PREPARE statements']}
                  parameters={[
                    {
                      ...CONNECTION_PARAMETERS.host,
                      value: isReplicaSelected
                        ? connectionInfo.db_host
                        : poolingConfiguration?.db_host ?? '',
                    },
                    {
                      ...CONNECTION_PARAMETERS.port,
                      value: poolingConfiguration?.db_port.toString() ?? '6543',
                    },
                    {
                      ...CONNECTION_PARAMETERS.database,
                      value: poolingConfiguration?.db_name ?? '',
                    },
                    { ...CONNECTION_PARAMETERS.user, value: poolingConfiguration?.db_user ?? '' },
                    { ...CONNECTION_PARAMETERS.pool_mode, value: 'transaction' },
                  ]}
                  onCopyCallback={() => handleCopy(selectedTab, 'transaction_pooler')}
                >
                  {!sharedPoolerPreferred && !ipv4Addon && (
                    <>
                      <Separator className="w-full" />
                      <Collapsible_Shadcn_ className="group">
                        <CollapsibleTrigger_Shadcn_
                          asChild
                          className="w-full justify-start !last:rounded-b group-data-[state=open]:rounded-b-none border-light px-3"
                        >
                          <Button
                            type="default"
                            size="large"
                            iconRight={
                              <ChevronDown className="transition group-data-[state=open]:rotate-180" />
                            }
                            className="text-foreground !bg-dash-sidebar justify-between"
                          >
                            <div className="text-xs flex items-center gap-x-2 py-2 px-1">
                              <span>Using the Shared Pooler</span>
                              <Badge variant="success">IPv4 compatible</Badge>
                            </div>
                          </Button>
                        </CollapsibleTrigger_Shadcn_>
                        <CollapsibleContent_Shadcn_ className="bg-dash-sidebar rounded-b border text-xs">
                          <CodeBlock
                            wrapperClassName={cn(
                              '[&_pre]:border-x-0 [&_pre]:border-t-0 [&_pre]:px-4 [&_pre]:py-3',
                              '[&_pre]:rounded-t-none'
                            )}
                            language={lang}
                            value={supavisorConnectionStrings['pooler'][selectedTab]}
                            className="[&_code]:text-[12px] [&_code]:text-foreground"
                            hideLineNumbers
                            onCopyCallback={() => handleCopy(selectedTab, 'transaction_pooler')}
                          />
                          <p className="px-3 py-2 text-foreground-light">
                            Only recommended when your network does not support IPv6. Added latency
                            compared to dedicated pooler.
                          </p>
                        </CollapsibleContent_Shadcn_>
                      </Collapsible_Shadcn_>
                    </>
                  )}
                </ConnectionPanel>
              )}

              {selectedMethod === 'session' && IS_PLATFORM && (
                <ConnectionPanel
                  type="session"
                  title={connectionStringMethodOptions.session.label}
                  contentType={contentType}
                  lang={lang}
                  badge="Shared Pooler"
                  fileTitle={fileTitle}
                  description={connectionStringMethodOptions.session.description}
                  connectionString={supavisorConnectionStrings['pooler'][selectedTab].replace(
                    '6543',
                    '5432'
                  )}
                  ipv4Status={{
                    type: 'success',
                    title: 'IPv4 compatible',
                    description: 'Session pooler connections are IPv4 proxied for free',
                    links: undefined,
                  }}
                  parameters={[
                    { ...CONNECTION_PARAMETERS.host, value: sharedPoolerConfig?.db_host ?? '' },
                    { ...CONNECTION_PARAMETERS.port, value: '5432' },
                    {
                      ...CONNECTION_PARAMETERS.database,
                      value: sharedPoolerConfig?.db_name ?? '',
                    },
                    { ...CONNECTION_PARAMETERS.user, value: sharedPoolerConfig?.db_user ?? '' },
                    { ...CONNECTION_PARAMETERS.pool_mode, value: 'session' },
                  ]}
                  onCopyCallback={() => handleCopy(selectedTab, 'session_pooler')}
                />
              )}
            </div>
          </div>

          {examplePostInstallCommands && (
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-5 w-full px-4 md:px-7 py-8">
              <StepLabel number={++stepNumber} className="items-start">
                Add the configuration package to read the settings
              </StepLabel>
              {examplePostInstallCommands?.map((cmd) => (
                <CodeBlock
                  key={`example-post-install-commands-${cmd}`}
                  className="text-sm"
                  wrapperClassName="lg:col-span-2"
                  value={cmd}
                  hideLineNumbers
                  language="bash"
                >
                  {cmd}
                </CodeBlock>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'python' && (
        <>
          <Separator />
          <Collapsible_Shadcn_ className="px-8 py-5">
            <CollapsibleTrigger_Shadcn_ className="group [&[data-state=open]>div>svg]:!-rotate-180">
              <div className="flex items-center gap-x-2 w-full">
                <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                  Connecting to SQL Alchemy
                </p>
                <ChevronDown
                  className="transition-transform duration-200"
                  strokeWidth={1.5}
                  size={14}
                />
              </div>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="my-2">
              <div className="text-foreground-light text-xs grid gap-2">
                <p>
                  Please use <code>postgresql://</code> instead of <code>postgres://</code> as your
                  dialect when connecting via SQLAlchemy.
                </p>
                <p>
                  Example:
                  <code>create_engine("postgresql+psycopg2://...")</code>
                </p>
                <p className="text-sm font-mono tracking-tight text-foreground-lighter"></p>
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        </>
      )}

      <Separator />
      <div className="px-8 pt-5 flex flex-col gap-y-1">
        <p className="text-sm">Reset your database password</p>
        <p className="text-sm text-foreground-lighter">
          You may reset your database password in your project's{' '}
          <InlineLink
            href={`/project/${projectRef}/database/settings`}
            className="text-foreground-lighter hover:text-foreground"
          >
            Database Settings
          </InlineLink>
        </p>
      </div>
    </div>
  )
}

const ConnectionStringMethodSelectItem = ({
  method,
  poolerBadge,
}: {
  method: ConnectionStringMethod
  poolerBadge?: string
}) => {
  const badges: ReactNode[] = []

  if (method !== 'direct') {
    badges.push(
      <Badge key="direct" className="flex gap-x-1">
        Shared Pooler
      </Badge>
    )
  }
  if (poolerBadge === 'Dedicated Pooler') {
    badges.push(
      <Badge key="dedicated" className="flex gap-x-1">
        {poolerBadge}
      </Badge>
    )
  }

  return (
    <SelectItem_Shadcn_ value={method} className="[&>span:first-child]:top-3.5">
      <div className="flex flex-col w-full py-1">
        <div className="flex gap-x-2 items-center">
          {connectionStringMethodOptions[method].label}
        </div>
        <div className="text-foreground-lighter text-xs">
          {connectionStringMethodOptions[method].description}
        </div>
        <div className="flex items-center gap-0.5 flex-wrap mt-1.5">
          {badges.map((badge) => badge)}
        </div>
      </div>
    </SelectItem_Shadcn_>
  )
}
