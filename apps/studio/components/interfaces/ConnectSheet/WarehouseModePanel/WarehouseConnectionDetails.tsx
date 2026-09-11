import { useParams } from 'common'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ConnectSheetStep } from '../ConnectSheetStep'
import { EnvRow } from '../content/server/common/EnvRow'
import { CopyPromptButton } from '../CopyPromptAdmonition'
import type { WarehouseCatalogCredentials } from './WarehouseModePanel.utils'
import { AlertError } from '@/components/ui/AlertError'
import CopyButton from '@/components/ui/CopyButton'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'
import {
  DUCKLAKE_METADATA_PASSWORD_ENV_VAR,
  DUCKLAKE_S3_SECRET_ENV_VAR,
  getDuckLakeSetupScript,
  getWarehouseFlightSqlConnectionString,
  getWarehouseFlightSqlEndpoint,
  getWarehouseUsqlCommand,
  parseWarehouseCatalogUrl,
} from '@/lib/warehouse'

const QUERY_ENGINES = [
  { value: 'flightsql', label: 'FlightSQL' },
  { value: 'duckdb', label: 'DuckDB' },
] as const

type QueryEngine = (typeof QUERY_ENGINES)[number]['value']

export interface WarehouseConnectionDetailsProps {
  onEditTables: () => void
}

function FieldRow({
  id,
  label,
  children,
}: {
  id?: string
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <FormLayout id={id} layout="horizontal" label={label}>
      {children}
    </FormLayout>
  )
}

const FlightSqlContent = ({ projectRef }: { projectRef: string }) => (
  <div className="space-y-4">
    <FieldRow id="warehouse-flightsql-endpoint" label="Endpoint">
      <Input
        id="warehouse-flightsql-endpoint"
        readOnly
        copy
        className="font-mono"
        value={getWarehouseFlightSqlEndpoint(projectRef)}
      />
    </FieldRow>
    <FieldRow id="warehouse-flightsql-connection-string" label="Connection string">
      <Input
        id="warehouse-flightsql-connection-string"
        readOnly
        copy
        className="font-mono"
        value={getWarehouseFlightSqlConnectionString(projectRef)}
      />
    </FieldRow>
    <FieldRow id="warehouse-flightsql-user" label="User">
      <Input id="warehouse-flightsql-user" readOnly copy className="font-mono" value="postgres" />
    </FieldRow>
    <FieldRow label="Password">
      <div className="flex justify-end">
        <Button asChild variant="default" size="tiny" icon={<KeyRound size={14} />}>
          <Link href={`/project/${projectRef}/settings/database`}>Reset database password</Link>
        </Button>
      </div>
    </FieldRow>
    <FieldRow label="Command line">
      <CodeBlock
        className="[&_code]:text-foreground"
        language="bash"
        hideLineNumbers
        wrapLongLines
        value={getWarehouseUsqlCommand(projectRef)}
      />
    </FieldRow>
  </div>
)

const DuckLakeSecretRow = ({ name, value }: { name: string; value: string }) => {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <EnvRow name={name} value={isRevealed ? value : '•'.repeat(16)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="tiny"
            className="px-1.5"
            aria-label={`${isRevealed ? 'Hide' : 'Reveal'} ${name}`}
            icon={isRevealed ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
            onClick={() => setIsRevealed((value) => !value)}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isRevealed ? 'Hide environment variable' : 'Reveal environment variable'}
        </TooltipContent>
      </Tooltip>
      <CopyButton variant="default" size="tiny" iconOnly aria-label={`Copy ${name}`} text={value} />
    </EnvRow>
  )
}

const DuckLakeEnvironmentVariables = ({
  credentials,
  password,
}: {
  credentials: WarehouseCatalogCredentials
  password: string
}) => {
  const environmentVariables = [
    `${DUCKLAKE_S3_SECRET_ENV_VAR}=${credentials.s3_secret_access_key}`,
    `${DUCKLAKE_METADATA_PASSWORD_ENV_VAR}=${password}`,
  ].join('\n')

  return (
    <div className="overflow-hidden rounded-lg border bg-surface-75" data-connect-prompt-ignore>
      <div className="flex items-center justify-between border-b bg-surface-100 py-2 pl-4 pr-2">
        <span className="font-mono text-xs text-foreground-light">.env</span>
        <CopyButton
          variant="default"
          size="tiny"
          copyLabel="Copy all"
          aria-label="Copy all DuckLake environment variables"
          text={environmentVariables}
        />
      </div>
      <div className="divide-y">
        <DuckLakeSecretRow
          name={DUCKLAKE_S3_SECRET_ENV_VAR}
          value={credentials.s3_secret_access_key}
        />
        <DuckLakeSecretRow name={DUCKLAKE_METADATA_PASSWORD_ENV_VAR} value={password} />
      </div>
    </div>
  )
}

const DuckLakeSetup = ({ credentials }: { credentials: WarehouseCatalogCredentials }) => {
  const connection = parseWarehouseCatalogUrl(credentials.catalog_url)
  const stepsContainerRef = useRef<HTMLDivElement | null>(null)

  if (connection === null) {
    return (
      <div className="space-y-4 border-t bg-muted/50 p-8">
        <Admonition
          type="warning"
          title="Could not read the catalog connection details"
          description="Copy the catalog URL and configure the DuckLake secrets manually."
        />
        <FieldRow id="warehouse-catalog-url" label="Catalog URL">
          <Input
            id="warehouse-catalog-url"
            readOnly
            copy
            reveal
            className="font-mono"
            value={credentials.catalog_url}
          />
        </FieldRow>
      </div>
    )
  }

  return (
    <div className="border-t bg-muted/50 p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3>Follow these steps</h3>
        <CopyPromptButton stepsContainerRef={stepsContainerRef} />
      </div>
      <div ref={stepsContainerRef}>
        <ConnectSheetStep
          number={1}
          title="Set environment variables"
          description="Add these credentials to your environment before running the SQL."
        >
          <DuckLakeEnvironmentVariables credentials={credentials} password={connection.password} />
        </ConnectSheetStep>
        <ConnectSheetStep
          number={2}
          title="Attach Warehouse"
          description="Run this script in DuckDB to configure the secrets and attach Warehouse."
        >
          <CodeBlock
            className="[&_code]:text-foreground"
            language="sql"
            hideLineNumbers
            value={getDuckLakeSetupScript({ credentials, connection })}
          />
        </ConnectSheetStep>
      </div>
    </div>
  )
}

const CatalogAccessToggle = ({
  projectRef,
  isEnabled,
}: {
  projectRef: string
  isEnabled: boolean
}) => {
  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onSuccess: (catalog) =>
      toast.success(
        catalog?.enabled ? 'DuckDB catalog access enabled' : 'DuckDB catalog access disabled'
      ),
  })

  return (
    <FormLayout
      layout="flex-row-reverse"
      label="Enable DuckDB catalog access"
      description="Creates the credentials DuckDB needs to attach Warehouse. Not required for FlightSQL."
    >
      <Switch
        aria-label="Enable DuckDB catalog access"
        checked={isEnabled}
        disabled={catalogMutation.isPending}
        onCheckedChange={(enabled) => catalogMutation.mutate({ projectRef, body: { enabled } })}
      />
    </FormLayout>
  )
}

export const WarehouseConnectionDetails = ({ onEditTables }: WarehouseConnectionDetailsProps) => {
  const { ref: projectRef } = useParams()
  const [engine, setEngine] = useState<QueryEngine>('flightsql')

  const {
    data: catalog,
    isPending: isCatalogPending,
    isError: isCatalogError,
    error: catalogError,
  } = useWarehouseCatalogQuery({ projectRef }, { enabled: engine === 'duckdb' })

  if (!projectRef) return null

  let catalogStatus = ''
  if (engine === 'duckdb' && isCatalogPending) catalogStatus = 'Loading DuckDB catalog access'
  if (engine === 'duckdb' && !isCatalogPending && !isCatalogError) {
    catalogStatus = 'DuckDB catalog access loaded'
  }

  return (
    <div>
      <div className="space-y-4 p-8">
        <div className="flex items-center gap-3">
          <Badge variant="success">Warehouse enabled</Badge>
          <Button className="ml-auto" variant="text" size="tiny" onClick={onEditTables}>
            Edit replicated tables
          </Button>
        </div>

        <FieldRow id="warehouse-query-engine" label="Query engine">
          <Select value={engine} onValueChange={(value) => setEngine(value as QueryEngine)}>
            <SelectTrigger id="warehouse-query-engine" className="ml-auto w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {QUERY_ENGINES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        {engine === 'flightsql' && <FlightSqlContent projectRef={projectRef} />}

        {engine === 'duckdb' && (
          <>
            {isCatalogPending && <GenericSkeletonLoader />}
            {isCatalogError && (
              <AlertError subject="Failed to load DuckLake catalog access" error={catalogError} />
            )}
            {!isCatalogPending && !isCatalogError && catalog !== undefined && (
              <CatalogAccessToggle projectRef={projectRef} isEnabled={catalog.enabled} />
            )}
          </>
        )}
        <span className="sr-only" role="status" aria-live="polite">
          {catalogStatus}
        </span>
      </div>

      {engine === 'duckdb' &&
        !isCatalogPending &&
        !isCatalogError &&
        catalog?.enabled &&
        catalog.credentials && <DuckLakeSetup credentials={catalog.credentials} />}
    </div>
  )
}
