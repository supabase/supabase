import { useParams } from 'common'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EnvRow } from '../../ConnectSheet/content/server/common/EnvRow'
import type { WarehouseCatalogCredentials } from './Warehouse.utils'
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

/**
 * Only engines we can produce real configuration for. DuckLake exposes a Postgres catalog over S3
 * rather than an Iceberg REST catalog, so Trino, Spark and PyIceberg need API support first.
 */
const QUERY_ENGINES = [
  { value: 'flightsql', label: 'FlightSQL' },
  { value: 'duckdb', label: 'DuckDB' },
] as const

type QueryEngine = (typeof QUERY_ENGINES)[number]['value']

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <FormLayout layout="horizontal" label={label}>
      {children}
    </FormLayout>
  )
}

const FlightSqlContent = ({ projectRef }: { projectRef: string }) => (
  <CardContent className="space-y-4">
    <FieldRow label="Endpoint">
      <Input
        readOnly
        copy
        className="font-mono"
        value={getWarehouseFlightSqlEndpoint(projectRef)}
      />
    </FieldRow>
    <FieldRow label="Connection string">
      <Input
        readOnly
        copy
        className="font-mono"
        value={getWarehouseFlightSqlConnectionString(projectRef)}
      />
    </FieldRow>
    <FieldRow label="User">
      <Input readOnly copy className="font-mono" value="postgres" />
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
  </CardContent>
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

/**
 * The DuckDB setup script inlines everything except the two passwords, which it reads via
 * `getenv()` -- so those are the only credential values surfaced as their own rows here.
 */
const DuckLakeSetup = ({ credentials }: { credentials: WarehouseCatalogCredentials }) => {
  const connection = parseWarehouseCatalogUrl(credentials.catalog_url)

  if (connection === null) {
    return (
      <CardContent className="space-y-4">
        <Admonition
          type="warning"
          title="Could not read the catalog connection details"
          description="Copy the catalog URL and configure the DuckLake secrets manually."
        />
        <FieldRow label="Catalog URL">
          <Input readOnly copy reveal className="font-mono" value={credentials.catalog_url} />
        </FieldRow>
      </CardContent>
    )
  }

  const environmentVariables = [
    `${DUCKLAKE_S3_SECRET_ENV_VAR}=${credentials.s3_secret_access_key}`,
    `${DUCKLAKE_METADATA_PASSWORD_ENV_VAR}=${connection.password}`,
  ].join('\n')

  return (
    <CardContent className="space-y-4">
      <p className="text-sm text-foreground-light max-w-xl">
        Set these environment variables before running the script:
      </p>
      <div className="overflow-hidden rounded-lg border bg-surface-75">
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
          <DuckLakeSecretRow
            name={DUCKLAKE_METADATA_PASSWORD_ENV_VAR}
            value={connection.password}
          />
        </div>
      </div>
      {/*
        `className` is what switches CodeBlock from its plain <code> fallback to the syntax
        highlighter -- without it the SQL renders unhighlighted and the blank lines between steps
        collapse.
      */}
      <CodeBlock
        className="[&_code]:text-foreground"
        language="sql"
        hideLineNumbers
        value={getDuckLakeSetupScript({ credentials, connection })}
      />
    </CardContent>
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
    <CardContent>
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
    </CardContent>
  )
}

interface WarehouseConnectionCardProps {
  variant?: 'default' | 'sheet'
}

export const WarehouseConnectionCard = ({ variant = 'default' }: WarehouseConnectionCardProps) => {
  const { ref: projectRef } = useParams()
  const [engine, setEngine] = useState<QueryEngine>('flightsql')

  const {
    data: catalog,
    isPending: isCatalogPending,
    isError: isCatalogError,
    error: catalogError,
  } = useWarehouseCatalogQuery({ projectRef }, { enabled: engine === 'duckdb' })

  if (!projectRef) return null

  const isSheet = variant === 'sheet'

  return (
    <Card
      className={cn(
        isSheet &&
          'space-y-4 rounded-none border-0 bg-transparent shadow-none [&>div]:border-0 [&>div]:p-0'
      )}
    >
      <CardContent className="border-none">
        <FieldRow label="Query engine">
          <Select value={engine} onValueChange={(value) => setEngine(value as QueryEngine)}>
            <SelectTrigger className="ml-auto w-48" aria-label="Query engine">
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
      </CardContent>
      {!isSheet && <Separator />}

      {engine === 'flightsql' && <FlightSqlContent projectRef={projectRef} />}

      {engine === 'duckdb' && (
        <>
          {isCatalogPending && (
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          )}
          {isCatalogError && (
            <CardContent>
              <AlertError subject="Failed to load DuckLake catalog access" error={catalogError} />
            </CardContent>
          )}
          {!isCatalogPending && !isCatalogError && catalog !== undefined && (
            <CatalogAccessToggle projectRef={projectRef} isEnabled={catalog.enabled} />
          )}
          {!isCatalogPending && !isCatalogError && catalog?.enabled && catalog.credentials && (
            <DuckLakeSetup credentials={catalog.credentials} />
          )}
        </>
      )}
    </Card>
  )
}

export const WarehouseConnectSection = () => {
  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Connect</PageSectionTitle>
          <PageSectionDescription>
            Point an analytical tool at Warehouse without querying your primary database.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <WarehouseConnectionCard />
      </PageSectionContent>
    </PageSection>
  )
}
