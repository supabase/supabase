import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { pluckObjectFields } from 'lib/helpers'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  CodeBlock,
  CodeBlockLang,
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
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { CodeBlockFileHeader, ConnectionPanel } from './ConnectionPanel'
import {
  constructConnStringSyntax,
  getConnectionStrings,
  getPoolerTld,
} from './DatabaseSettings.utils'
import examples, { Example } from './DirectConnectionExamples'

const CONNECTION_TYPES: {
  id: ConnectionType
  label: string
  contentType: 'input' | 'code'
  lang: CodeBlockLang
  fileTitle: string | undefined
}[] = [
  { id: 'uri', label: 'URI', contentType: 'input', lang: 'bash', fileTitle: undefined },
  { id: 'psql', label: 'PSQL', contentType: 'code', lang: 'bash', fileTitle: undefined },
  { id: 'golang', label: 'Golang', contentType: 'code', lang: 'go', fileTitle: '.env' },
  { id: 'jdbc', label: 'JDBC', contentType: 'input', lang: 'bash', fileTitle: undefined },
  {
    id: 'dotnet',
    label: '.NET',
    contentType: 'code',
    lang: 'csharp',
    fileTitle: 'appsettings.json',
  },
  { id: 'nodejs', label: 'Node.js', contentType: 'code', lang: 'js', fileTitle: '.env' },
  { id: 'php', label: 'PHP', contentType: 'code', lang: 'php', fileTitle: '.env' },
  { id: 'python', label: 'Python', contentType: 'code', lang: 'python', fileTitle: '.env' },
  { id: 'sqlalchemy', label: 'SQLAlchemy', contentType: 'code', lang: 'python', fileTitle: '.env' },
]

type ConnectionType =
  | 'uri'
  | 'psql'
  | 'golang'
  | 'jdbc'
  | 'dotnet'
  | 'nodejs'
  | 'php'
  | 'python'
  | 'sqlalchemy'

const CONNECTION_PARAMETERS = {
  host: {
    key: 'host',
    description: 'The hostname of your database',
  },
  port: {
    key: 'port',
    description: 'Port number for the connection',
  },
  database: {
    key: 'database',
    description: 'Default database name',
  },
  user: {
    key: 'user',
    description: 'Database user',
  },
  pool_mode: {
    key: 'pool_mode',
    description: 'Connection pooling behavior',
  },
} as const

export const DatabaseConnectionString = () => {
  const project = useSelectedProject()
  const { ref: projectRef, connectionString } = useParams()
  const snap = useDatabaseSettingsStateSnapshot()
  const state = useDatabaseSelectorStateSnapshot()
  const { project: projectDetails, isLoading: isProjectLoading } = useProjectContext()

  const [poolingMode, setPoolingMode] = useState<'transaction' | 'session'>('transaction')
  const [selectedTab, setSelectedTab] = useState<ConnectionType>('uri')

  const { data: poolingInfo, isSuccess: isSuccessPoolingInfo } = usePoolingConfigurationQuery({
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

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )

  const { data: addons, isSuccess: isSuccessAddons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const { mutate: sendEvent } = useSendEventMutation()

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)
  const connectionTld =
    projectDetails?.restUrl !== undefined
      ? new URL(projectDetails?.restUrl ?? '').hostname.split('.').pop() ?? 'co'
      : 'co'

  const handleCopy = (id: string) => {
    const labelValue = CONNECTION_TYPES.find((type) => type.id === id)?.label
    sendEvent({
      category: 'settings',
      action: 'copy_connection_string',
      label: labelValue ? labelValue : '',
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

  const lang = CONNECTION_TYPES.find((type) => type.id === selectedTab)?.lang ?? 'bash'
  const contentType =
    CONNECTION_TYPES.find((type) => type.id === selectedTab)?.contentType ?? 'input'

  const example: Example | undefined = examples[selectedTab as keyof typeof examples]

  const exampleFiles = example?.files
  const exampleInstallCommands = example?.installCommands
  const examplePostInstallCommands = example?.postInstallCommands
  const hasCodeExamples = exampleFiles || exampleInstallCommands
  const fileTitle = CONNECTION_TYPES.find((type) => type.id === selectedTab)?.fileTitle

  let stepNumber = 0

  const StepLabel = ({
    number,
    children,
    ...props
  }: { number: number; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cn('flex items-center gap-2', props.className)}>
      <div className="flex font-mono text-xs items-center justify-center w-6 h-6 border border-strong rounded-md bg-surface-100">
        {number}
      </div>
      <span>{children}</span>
    </div>
  )

  return (
    <div className="flex flex-col">
      <div className={cn('flex items-center gap-3', DIALOG_PADDING_X)}>
        <div className="flex">
          <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
            Type
          </span>
          <Select_Shadcn_
            value={selectedTab}
            onValueChange={(connectionType: ConnectionType) => setSelectedTab(connectionType)}
          >
            <SelectTrigger_Shadcn_ size="small" className="w-auto rounded-l-none">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {CONNECTION_TYPES.map((type) => (
                <SelectItem_Shadcn_ key={type.id} value={type.id}>
                  {type.label}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <DatabaseSelector buttonProps={{ size: 'small' }} />
      </div>

      {isLoadingReadReplicas && <ShimmeringLoader className="h-8 w-full" />}
      {isErrorReadReplicas && (
        <AlertError error={readReplicasError} subject="Failed to retrieve database settings" />
      )}

      {isSuccessReadReplicas && (
        <div className="flex flex-col divide-y divide-border">
          {/* // handle non terminal examples */}
          {hasCodeExamples && (
            <div className="grid grid-cols-2 gap-20 w-full px-7 py-8">
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
                <div className="">
                  <StepLabel number={++stepNumber} className="mb-4">
                    Add file to project
                  </StepLabel>
                  {exampleFiles?.map((file, i) => (
                    <div key={i} className="">
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
            <div className="divide-y divide-border-muted">
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="direct"
                title="Direct connection"
                fileTitle={fileTitle}
                description="Ideal for applications with persistent, long-lived connections, such as those running on virtual machines or long-standing containers."
                connectionString={connectionStrings['direct'][selectedTab]}
                onCopy={() => handleCopy(selectedTab)}
                ipv4Status={{
                  type: !ipv4Addon ? 'error' : 'success',
                  title: !ipv4Addon ? 'Not IPv4 compatible' : 'IPv4 compatible',
                  link: !ipv4Addon
                    ? {
                        text: 'Purchase IPv4 support',
                        url: `/project/${projectRef}/settings/addons?panel=ipv4`,
                      }
                    : {
                        text: 'Update IPv4 settings',
                        url: `/project/${projectRef}/settings/addons?panel=ipv4`,
                      },
                }}
                parameters={[
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.host, value: connectionInfo.db_host },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.port, value: connectionInfo.db_port },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                ]}
              />
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="transaction"
                title="Transaction pooler"
                fileTitle={fileTitle}
                description="Ideal for stateless applications like serverless functions where each interaction with the database is brief and isolated."
                connectionString={connectionStrings['pooler'][selectedTab]}
                onCopy={() => handleCopy(selectedTab)}
                ipv4Status={{
                  type: 'success',
                  title: 'IPv4 compatible',
                  description: 'Transaction pooler connections are IPv4 proxied for free.',
                }}
                notice="Transaction pooler does not support prepared statements"
                parameters={[
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.host, value: `${projectRef}.pooler.supabase.${poolerTld}` },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.port, value: poolingConfiguration?.db_port.toString() ?? '6543', description: 'Port number for transaction pooler' },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.pool_mode, value: 'transaction', description: 'Each transaction uses a different connection' },
                ]}
              />
              <ConnectionPanel
                contentType={contentType}
                lang={lang}
                type="session"
                title="Session pooler"
                fileTitle={fileTitle}
                description="Better suited for applications with longer-running sessions that need persistent state or session-based features."
                connectionString={connectionStrings['pooler'][selectedTab].replace('6543', '5432')}
                onCopy={() => handleCopy(selectedTab)}
                ipv4Status={{
                  type: 'success',
                  title: 'IPv4 compatible',
                  description: 'Session pooler connections are IPv4 proxied for free.',
                }}
                parameters={[
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.host, value: `${projectRef}.pooler.supabase.${poolerTld}` },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.port, value: '5432', description: 'Port number for session pooler' },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.database, value: connectionInfo.db_name },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.user, value: connectionInfo.db_user },
                  // prettier-ignore
                  { ...CONNECTION_PARAMETERS.pool_mode, value: 'session', description: 'Connection is reserved for the entire session' },
                ]}
              />
            </div>
          </div>
          {examplePostInstallCommands && (
            <div className="grid grid-cols-2 gap-20 w-full px-7  py-10">
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
