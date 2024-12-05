import { ChevronDown } from 'lucide-react'
import { HTMLAttributes, ReactNode, useState } from 'react'

import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
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
} from './Connect.constants'
import { CodeBlockFileHeader, ConnectionPanel } from './ConnectionPanel'
import { getConnectionStrings, getPoolerTld } from './DatabaseSettings.utils'
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
  const state = useDatabaseSelectorStateSnapshot()

  const [selectedTab, setSelectedTab] = useState<DatabaseConnectionType>('uri')

  const {
    data: poolingInfo,
    error: poolingInfoError,
    isLoading: isLoadingPoolingInfo,
    isError: isErrorPoolingInfo,
    isSuccess: isSuccessPoolingInfo,
  } = usePoolingConfigurationQuery({
    projectRef,
  })
  const poolingConfiguration = poolingInfo?.find((x) => x.identifier === state.selectedDatabaseId)

  const {
    data: databases,
    error: readReplicasError,
    isLoading: isLoadingReadReplicas,
    isError: isErrorReadReplicas,
    isSuccess: isSuccessReadReplicas,
  } = useReadReplicasQuery({ projectRef })

  const error = poolingInfoError || readReplicasError
  const isLoading = isLoadingPoolingInfo || isLoadingReadReplicas
  const isError = isErrorPoolingInfo || isErrorReadReplicas
  const isSuccess = isSuccessPoolingInfo && isSuccessReadReplicas

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const { mutate: sendEvent } = useSendEventMutation()

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)

  const handleCopy = (id: string) => {
    const labelValue = DATABASE_CONNECTION_TYPES.find((type) => type.id === id)?.label
    sendEvent({
      category: 'settings',
      action: 'copy_connection_string',
      label: labelValue ?? '',
    })
  }

  const connectionStrings =
    isSuccessPoolingInfo && poolingConfiguration !== undefined
      ? getConnectionStrings(connectionInfo, poolingConfiguration, {
          projectRef,
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

  const poolerTld =
    isSuccessPoolingInfo && poolingConfiguration !== undefined
      ? getPoolerTld(poolingConfiguration?.connectionString)
      : 'com'

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

  return (
    <div className="flex flex-col">
      <div className={cn('flex items-center gap-3', DIALOG_PADDING_X)}>
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
            <div className="grid grid-cols-2 gap-x-20 w-full px-7 py-8">
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
              <div className="px-7 pt-8">
                <StepLabel number={++stepNumber}>Choose type of connection</StepLabel>
              </div>
            )}
            <div className="divide-y divide-border-muted [&>div]:px-7 [&>div]:py-8">
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
                  description: ipv4Addon && 'Connections are IPv4 proxied with IPv4 addon.',
                  link: !ipv4Addon
                    ? {
                        text: 'IPv4 addon',
                        url: `/project/${projectRef}/settings/addons?panel=ipv4`,
                      }
                    : {
                        text: 'IPv4 settings',
                        url: `/project/${projectRef}/settings/addons?panel=ipv4`,
                      },
                }}
                parameters={[
                  { ...CONNECTION_PARAMETERS.host, value: connectionInfo.db_host },
                  { ...CONNECTION_PARAMETERS.port, value: connectionInfo.db_port },
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                ]}
                onCopyCallback={() => handleCopy(selectedTab)}
              />
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="transaction"
                title="Transaction pooler"
                fileTitle={fileTitle}
                description="Ideal for stateless applications like serverless functions where each interaction with Postgres is brief and isolated."
                connectionString={connectionStrings['pooler'][selectedTab]}
                ipv4Status={{
                  type: 'success',
                  title: 'IPv4 compatible',
                  description: 'Transaction pooler connections are IPv4 proxied for free.',
                }}
                notice={['Does not support PREPARE statements']}
                parameters={[
                  {
                    ...CONNECTION_PARAMETERS.host,
                    value: `${projectRef}.pooler.supabase.${poolerTld}`,
                  },
                  {
                    ...CONNECTION_PARAMETERS.port,
                    value: poolingConfiguration?.db_port.toString() ?? '6543',
                    description: 'Port number for transaction pooler',
                  },
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                  {
                    ...CONNECTION_PARAMETERS.pool_mode,
                    value: 'transaction',
                    description: 'Each transaction uses a different connection',
                  },
                ]}
                onCopyCallback={() => handleCopy(selectedTab)}
              />
              {ipv4Addon && (
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
                fileTitle={fileTitle}
                description="Only recommended as an alternative to Direct Connection, when connecting via an IPv4 network."
                connectionString={connectionStrings['pooler'][selectedTab].replace('6543', '5432')}
                ipv4Status={{
                  type: 'success',
                  title: 'IPv4 compatible',
                  description: 'Session pooler connections are IPv4 proxied for free.',
                }}
                parameters={[
                  {
                    ...CONNECTION_PARAMETERS.host,
                    value: `${projectRef}.pooler.supabase.${poolerTld}`,
                  },
                  {
                    ...CONNECTION_PARAMETERS.port,
                    value: '5432',
                    description: 'Port number for session pooler',
                  },
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                  {
                    ...CONNECTION_PARAMETERS.pool_mode,
                    value: 'session',
                    description: 'Connection is reserved for the entire session',
                  },
                ]}
                onCopyCallback={() => handleCopy(selectedTab)}
              />
            </div>
          </div>
          {examplePostInstallCommands && (
            <div className="grid grid-cols-2 gap-20 w-full px-7 py-10">
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
                      <Tooltip_Shadcn_ key={`syntax-${idx}`}>
                        <TooltipTrigger_Shadcn_ asChild>
                          <span className="text-foreground text-xs font-mono">{x.value}</span>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom">{x.tooltip}</TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
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
