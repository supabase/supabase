import { ChevronDown } from 'lucide-react'
import { HTMLAttributes, ReactNode, useState } from 'react'

import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { pluckObjectFields } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
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
import { Admonition } from 'ui-patterns'
import {
  CONNECTION_PARAMETERS,
  DATABASE_CONNECTION_TYPES,
  DatabaseConnectionType,
  IPV4_ADDON_TEXT,
  PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT,
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
    <div className="flex font-mono text-xs items-center justify-center w-6 h-6 border border-strong rounded-md bg-surface-100">
      {number}
    </div>
    <span>{children}</span>
  </div>
)

export const DatabaseConnectionString = () => {
  const { ref: projectRef } = useParams()
  const org = useSelectedOrganization()
  const state = useDatabaseSelectorStateSnapshot()
  const allowPgBouncerSelection = useFlag('dualPoolerSupport')

  const [selectedTab, setSelectedTab] = useState<DatabaseConnectionType>('uri')

  const {
    data: pgbouncerConfig,
    error: pgbouncerError,
    isLoading: isLoadingPgbouncerConfig,
    isError: isErrorPgbouncerConfig,
    isSuccess: isSuccessPgBouncerConfig,
  } = usePgbouncerConfigQuery({ projectRef })
  const {
    data: supavisorConfig,
    error: supavisorConfigError,
    isLoading: isLoadingSupavisorConfig,
    isError: isErrorSupavisorConfig,
    isSuccess: isSuccessSupavisorConfig,
  } = useSupavisorConfigurationQuery({ projectRef })
  const isPgBouncerEnabled = allowPgBouncerSelection && !!pgbouncerConfig?.pgbouncer_enabled
  const poolingConfiguration = isPgBouncerEnabled
    ? pgbouncerConfig
    : supavisorConfig?.find((x) => x.identifier === state.selectedDatabaseId)

  const {
    data: databases,
    error: readReplicasError,
    isLoading: isLoadingReadReplicas,
    isError: isErrorReadReplicas,
    isSuccess: isSuccessReadReplicas,
  } = useReadReplicasQuery({ projectRef })

  const poolerError = isPgBouncerEnabled ? pgbouncerError : supavisorConfigError
  const isLoadingPoolerConfig = isPgBouncerEnabled
    ? isLoadingPgbouncerConfig
    : isLoadingSupavisorConfig
  const isErrorPoolerConfig = isPgBouncerEnabled ? isErrorPgbouncerConfig : isErrorSupavisorConfig
  const isSuccessPoolerConfig = isPgBouncerEnabled
    ? isSuccessPgBouncerConfig
    : isSuccessSupavisorConfig

  const error = poolerError || readReplicasError
  const isLoading = isLoadingPoolerConfig || isLoadingReadReplicas
  const isError = isErrorPoolerConfig || isErrorReadReplicas
  const isSuccess = isSuccessPoolerConfig && isSuccessReadReplicas

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const { mutate: sendEvent } = useSendEventMutation()

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)

  const handleCopy = (
    connectionTypeId: string,
    connectionMethod: 'direct' | 'transaction_pooler' | 'session_pooler'
  ) => {
    const connectionInfo = DATABASE_CONNECTION_TYPES.find((type) => type.id === connectionTypeId)
    const connectionType = connectionInfo?.label ?? 'Unknown'
    const lang = connectionInfo?.lang ?? 'Unknown'
    sendEvent({
      action: 'connection_string_copied',
      properties: { connectionType, lang, connectionMethod },
      groups: { project: projectRef ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
  }

  const connectionStrings =
    isSuccessSupavisorConfig && poolingConfiguration !== undefined
      ? getConnectionStrings({
          connectionInfo,
          poolingInfo: {
            connectionString:
              'connection_string' in poolingConfiguration
                ? poolingConfiguration.connection_string
                : poolingConfiguration.connectionString,
            db_host: poolingConfiguration.db_host,
            db_name: poolingConfiguration.db_name,
            db_port: poolingConfiguration.db_port,
            db_user: poolingConfiguration.db_user,
          },
          metadata: { projectRef },
        })
      : {
          direct: {
            uri: '',
            psql: '',
            golang: '',
            jdbc: '',
            dotnet: '',
            nodejs: '',
            php: '',
            python: '',
            sqlalchemy: '',
          },
          pooler: {
            uri: '',
            psql: '',
            golang: '',
            jdbc: '',
            dotnet: '',
            nodejs: '',
            php: '',
            python: '',
            sqlalchemy: '',
          },
        }

  // @mildtomato - Possible reintroduce later
  //
  // const poolerConnStringSyntax =
  //   isSuccessPoolingInfo && poolingConfiguration !== undefined
  //     ? constructConnStringSyntax(poolingConfiguration?.connectionString, {
  //         selectedTab,
  //         usePoolerConnection: snap.usePoolerConnection,
  //         ref: projectRef as string,
  //         cloudProvider: isProjectLoading ? '' : project?.cloud_provider || '',
  //         region: isProjectLoading ? '' : project?.region || '',
  //         tld: snap.usePoolerConnection ? poolerTld : connectionTld,
  //         portNumber: `[5432 or 6543]`,
  //       })
  //     : []
  // useEffect(() => {
  //   // if (poolingConfiguration?.pool_mode === 'session') {
  //   //   setPoolingMode(poolingConfiguration.pool_mode)
  //   // }
  // }, [poolingConfiguration?.pool_mode])

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
    url: `/project/${projectRef}/settings/database#connection-pooling`,
  }
  const buttonLinks = !ipv4Addon
    ? [ipv4AddOnUrl, ...(isPgBouncerEnabled ? [poolerSettingsUrl] : [])]
    : [ipv4SettingsUrl, ...(isPgBouncerEnabled ? [poolerSettingsUrl] : [])]

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3',
          DIALOG_PADDING_X
        )}
      >
        <div className="flex">
          <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
            Type
          </span>
          <Select_Shadcn_
            value={selectedTab}
            onValueChange={(connectionType: DatabaseConnectionType) =>
              setSelectedTab(connectionType)
            }
          >
            <SelectTrigger_Shadcn_ size="small" className="w-auto rounded-l-none">
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
        <DatabaseSelector buttonProps={{ size: 'small' }} />
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
            <div className="grid grid-cols-2 gap-x-20 w-full px-4 md:px-7 py-8">
              <div>
                <StepLabel number={++stepNumber} className="mb-4">
                  Install the following
                </StepLabel>
                {exampleInstallCommands?.map((cmd, i) => (
                  <CodeBlock
                    key={i}
                    className="[&_code]:text-[12px] [&_code]:text-foreground"
                    value={cmd}
                    hideLineNumbers
                    language="bash"
                  >
                    {cmd}
                  </CodeBlock>
                ))}
              </div>
              {exampleFiles && exampleFiles?.length > 0 && (
                <div>
                  <StepLabel number={++stepNumber} className="mb-4">
                    Add file to project
                  </StepLabel>
                  {exampleFiles?.map((file, i) => (
                    <div key={i}>
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
                <StepLabel number={++stepNumber}>Choose type of connection</StepLabel>
              </div>
            )}
            <div className="divide-y divide-border-muted [&>div]:px-4 [&>div]:md:px-7 [&>div]:py-8">
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="direct"
                title="Direct connection"
                fileTitle={fileTitle}
                description="Ideal for applications with persistent, long-lived connections, such as those running on virtual machines or long-standing containers."
                connectionString={connectionStrings['direct'][selectedTab]}
                ipv4Status={{
                  type: !ipv4Addon ? 'error' : 'success',
                  title: !ipv4Addon ? 'Not IPv4 compatible' : 'IPv4 compatible',
                  description:
                    isPgBouncerEnabled && !ipv4Addon
                      ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
                      : !isPgBouncerEnabled
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
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="transaction"
                title="Transaction pooler"
                badge={isPgBouncerEnabled ? 'Dedicated Pooler' : 'Supavisor'}
                fileTitle={fileTitle}
                description="Ideal for stateless applications like serverless functions where each interaction with Postgres is brief and isolated."
                connectionString={connectionStrings['pooler'][selectedTab]}
                ipv4Status={{
                  type: isPgBouncerEnabled && !ipv4Addon ? 'error' : 'success',
                  title: isPgBouncerEnabled && !ipv4Addon ? 'IPv4 incompatible' : 'IPv4 compatible',
                  description:
                    isPgBouncerEnabled && !ipv4Addon
                      ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
                      : !isPgBouncerEnabled
                        ? 'Transaction pooler connections are IPv4 proxied for free.'
                        : IPV4_ADDON_TEXT,
                  links: isPgBouncerEnabled ? buttonLinks : undefined,
                }}
                notice={['Does not support PREPARE statements']}
                parameters={[
                  { ...CONNECTION_PARAMETERS.host, value: poolingConfiguration?.db_host ?? '' },
                  {
                    ...CONNECTION_PARAMETERS.port,
                    value: poolingConfiguration?.db_port.toString() ?? '6543',
                  },
                  { ...CONNECTION_PARAMETERS.database, value: poolingConfiguration?.db_name ?? '' },
                  { ...CONNECTION_PARAMETERS.user, value: poolingConfiguration?.db_user ?? '' },
                  { ...CONNECTION_PARAMETERS.pool_mode, value: 'transaction' },
                ]}
                onCopyCallback={() => handleCopy(selectedTab, 'transaction_pooler')}
              />
              {ipv4Addon && !isPgBouncerEnabled && (
                <Admonition
                  type="warning"
                  title="Highly recommended to not use Session Pooler"
                  className="[&>div]:gap-0 px-8 [&>svg]:left-7 border-0 border-b rounded-none border-border-muted !py-4 mb-0"
                >
                  <p className="text-sm text-foreground-lighter !mb-0">
                    If you are using Session Pooler, we recommend switching to Direct Connection.
                  </p>
                </Admonition>
              )}

              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="session"
                title="Session pooler"
                badge={isPgBouncerEnabled ? 'Dedicated Pooler' : 'Supavisor'}
                fileTitle={fileTitle}
                description={
                  isPgBouncerEnabled
                    ? 'Recommended if you need to use prepared statements, or other features that are only available in Session mode.'
                    : 'Only recommended as an alternative to Direct Connection, when connecting via an IPv4 network.'
                }
                connectionString={connectionStrings['pooler'][selectedTab].replace('6543', '5432')}
                ipv4Status={{
                  type: isPgBouncerEnabled && !ipv4Addon ? 'error' : 'success',
                  title: isPgBouncerEnabled && !ipv4Addon ? 'IPv4 incompatible' : 'IPv4 compatible',
                  description:
                    isPgBouncerEnabled && !ipv4Addon
                      ? PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT
                      : !isPgBouncerEnabled
                        ? 'Session pooler connections are IPv4 proxied for free'
                        : IPV4_ADDON_TEXT,
                  links: isPgBouncerEnabled ? buttonLinks : undefined,
                }}
                parameters={[
                  { ...CONNECTION_PARAMETERS.host, value: poolingConfiguration?.db_host ?? '' },
                  { ...CONNECTION_PARAMETERS.port, value: '5432' },
                  { ...CONNECTION_PARAMETERS.database, value: poolingConfiguration?.db_name ?? '' },
                  { ...CONNECTION_PARAMETERS.user, value: poolingConfiguration?.db_user ?? '' },
                  { ...CONNECTION_PARAMETERS.pool_mode, value: 'session' },
                ]}
                onCopyCallback={() => handleCopy(selectedTab, 'session_pooler')}
              />
            </div>
          </div>
          {examplePostInstallCommands && (
            <div className="grid grid-cols-2 gap-20 w-full px-4 md:px-7 py-10">
              <div>
                <StepLabel number={++stepNumber} className="mb-4">
                  Add the configuration package to read the settings
                </StepLabel>
                {examplePostInstallCommands?.map((cmd, i) => (
                  <CodeBlock
                    key={i}
                    className="text-sm"
                    value={cmd}
                    hideLineNumbers
                    language="bash"
                  >
                    {cmd}
                  </CodeBlock>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Possibly reintroduce later - @mildtomato */}
      {/* <Separator />
        <Collapsible_Shadcn_ className={cn('px-8 pt-5', selectedTab === 'python' && 'pb-5')}>
          <CollapsibleTrigger_Shadcn_ className="group [&[data-state=open]>div>svg]:!-rotate-180">
            <div className="flex items-center gap-x-2 w-full">
              <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                How to connect to a different database or switch to another user
              </p>
              <ChevronDown
                className="transition-transform duration-200"
                strokeWidth={1.5}
                size={14}
              />
            </div>
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="my-2">
            <div className="text-foreground-light">
              <p className="text-xs">
                You can use the following URI format to switch to a different database or user
                {snap.usePoolerConnection ? ' when using connection pooling' : ''}.
              </p>
              <p className="text-sm tracking-tight text-foreground-lighter">
                {poolerConnStringSyntax.map((x, idx) => {
                  if (x.tooltip) {
                    return (
                      <Tooltip key={`syntax-${idx}`}>
                        <TooltipTrigger asChild>
                          <span className="text-foreground text-xs font-mono">{x.value}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{x.tooltip}</TooltipContent>
                      </Tooltip>
                    )
                  } else {
                    return (
                      <span key={`syntax-${idx}`} className="text-xs font-mono">
                        {x.value}
                      </span>
                    )
                  }
                })}
              </p>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_> */}

      {selectedTab === 'python' && (
        <>
          <Separator />
          <Collapsible_Shadcn_ className="px-8 pt-5">
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
    </div>
  )
}
