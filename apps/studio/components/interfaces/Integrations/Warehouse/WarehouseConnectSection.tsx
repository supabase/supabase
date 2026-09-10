import { useParams } from 'common'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { WarehouseCatalogCredentials } from './Warehouse.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
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
  <Card>
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-light">
            Same password as your primary database.
          </span>
          <Button
            asChild
            variant="default"
            size="tiny"
            icon={<KeyRound size={14} />}
            className="ml-auto"
          >
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
  </Card>
)

/**
 * The DuckDB setup script inlines everything except the two passwords, which it reads via
 * `getenv()` -- so those are the only credential values surfaced as their own rows here.
 */
const DuckLakeSetup = ({ credentials }: { credentials: WarehouseCatalogCredentials }) => {
  const connection = parseWarehouseCatalogUrl(credentials.catalog_url)

  if (connection === null) {
    return (
      <Card>
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
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground-light max-w-xl">
          The script reads both passwords from environment variables. Set these before running it:
        </p>
        <FieldRow label={<span className="font-mono text-xs">{DUCKLAKE_S3_SECRET_ENV_VAR}</span>}>
          <Input
            readOnly
            copy
            reveal
            className="font-mono"
            value={credentials.s3_secret_access_key}
          />
        </FieldRow>
        <FieldRow
          label={<span className="font-mono text-xs">{DUCKLAKE_METADATA_PASSWORD_ENV_VAR}</span>}
        >
          <Input readOnly copy reveal className="font-mono" value={connection.password} />
        </FieldRow>
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
    </Card>
  )
}

const CatalogAccessToggle = ({ projectRef }: { projectRef: string }) => {
  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onSuccess: () => toast.success('Catalog access enabled'),
  })

  return (
    <Card>
      <CardContent>
        <FormLayout
          layout="flex-row-reverse"
          label="Allow DuckDB clients to attach Warehouse"
          description="Exposes the DuckLake catalog and its credentials. Not needed for FlightSQL."
        >
          <Switch
            checked={false}
            disabled={catalogMutation.isPending}
            onCheckedChange={() => catalogMutation.mutate({ projectRef, body: { enabled: true } })}
          />
        </FormLayout>
      </CardContent>
    </Card>
  )
}

export interface WarehouseConnectSectionProps {
  /**
   * Turning catalog access on provisions, so only the integration offers it. The Connect sheet
   * points here instead.
   */
  canManageCatalog?: boolean
}

export const WarehouseConnectSection = ({
  canManageCatalog = false,
}: WarehouseConnectSectionProps) => {
  const { ref: projectRef } = useParams()
  const [engine, setEngine] = useState<QueryEngine>('flightsql')

  const {
    data: catalog,
    isPending: isCatalogPending,
    isError: isCatalogError,
    error: catalogError,
  } = useWarehouseCatalogQuery({ projectRef }, { enabled: engine === 'duckdb' })

  if (!projectRef) return null

  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Connect</PageSectionTitle>
          <PageSectionDescription>
            Point an analytical tool at Warehouse without querying your primary database.
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <Select value={engine} onValueChange={(value) => setEngine(value as QueryEngine)}>
            <SelectTrigger className="w-48" aria-label="Query engine">
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
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {engine === 'flightsql' && <FlightSqlContent projectRef={projectRef} />}

        {engine === 'duckdb' && (
          <>
            {isCatalogPending && <GenericSkeletonLoader />}
            {isCatalogError && (
              <AlertError subject="Failed to load DuckLake catalog access" error={catalogError} />
            )}
            {!isCatalogPending && !isCatalogError && !catalog?.enabled && canManageCatalog && (
              <CatalogAccessToggle projectRef={projectRef} />
            )}
            {!isCatalogPending && !isCatalogError && !catalog?.enabled && !canManageCatalog && (
              <p className="text-sm text-foreground-light max-w-lg">
                Catalog access is off. Turn it on in{' '}
                <InlineLink href={`/project/${projectRef}/integrations/warehouse/overview`}>
                  the Warehouse integration
                </InlineLink>{' '}
                to attach this project&apos;s Warehouse from DuckDB.
              </p>
            )}
            {!isCatalogPending && !isCatalogError && catalog?.enabled && catalog.credentials && (
              <DuckLakeSetup credentials={catalog.credentials} />
            )}
          </>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
