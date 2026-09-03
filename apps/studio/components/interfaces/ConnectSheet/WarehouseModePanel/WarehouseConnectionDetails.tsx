import { useParams } from 'common'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { maskSecretValue, type WarehouseCatalogCredentials } from './WarehouseModePanel.utils'
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

export interface WarehouseConnectionDetailsProps {
  onEditTables: () => void
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    // `minmax(0,1fr)` rather than `1fr`: a 1fr track keeps `min-width: auto`, so a long
    // single-line value (the FlightSQL connection string) stretches the track past the panel
    // instead of truncating inside it.
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4 items-center">
      <span className="text-sm text-foreground-light">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function CopyValueRow({ value, mono = true }: { value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 h-9 px-3 rounded-md border bg-control">
      <span
        className={cn('min-w-0 flex-1 truncate text-sm text-foreground', mono && 'font-mono')}
        title={value}
      >
        {value}
      </span>
      <CopyButton
        variant="default"
        size="tiny"
        iconOnly
        text={value}
        aria-label={`Copy ${value}`}
        className="shrink-0"
      />
    </div>
  )
}

function MaskedCopyValueRow({ value }: { value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 h-9 px-3 rounded-md border bg-control">
      <span className="min-w-0 flex-1 truncate text-sm font-mono text-foreground-lighter">
        {maskSecretValue(value)}
      </span>
      <CopyButton
        variant="default"
        size="tiny"
        iconOnly
        asyncText={() => value}
        aria-label="Copy secret value"
        className="shrink-0"
      />
    </div>
  )
}

/**
 * The DuckDB setup script inlines everything except the two passwords, which it reads via
 * `getenv()` — so those are the only credential values surfaced as their own rows here.
 */
function DuckLakeSetup({ credentials }: { credentials: WarehouseCatalogCredentials }) {
  const connection = parseWarehouseCatalogUrl(credentials.catalog_url)

  if (connection === null) {
    return (
      <div className="flex flex-col gap-3 mt-2">
        <Admonition
          type="warning"
          title="Could not read the catalog connection details"
          description="Copy the catalog URL and configure the DuckLake secrets manually."
        />
        <FieldRow label="Catalog URL">
          <MaskedCopyValueRow value={credentials.catalog_url} />
        </FieldRow>
      </div>
    )
  }

  const setupScript = getDuckLakeSetupScript({ credentials, connection })

  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-sm text-foreground-light max-w-xl mb-1">
        Attach this project's Warehouse directly from DuckDB. The script reads both passwords from
        environment variables — set these before running it:
      </p>
      <FieldRow label={<span className="font-mono text-xs">{DUCKLAKE_S3_SECRET_ENV_VAR}</span>}>
        <MaskedCopyValueRow value={credentials.s3_secret_access_key} />
      </FieldRow>
      <FieldRow
        label={<span className="font-mono text-xs">{DUCKLAKE_METADATA_PASSWORD_ENV_VAR}</span>}
      >
        <MaskedCopyValueRow value={connection.password} />
      </FieldRow>
      {/*
        `className` is what switches CodeBlock from its plain <code> fallback to the syntax
        highlighter — without it the SQL renders unhighlighted and the blank lines between steps
        collapse.
      */}
      <CodeBlock
        className="[&_code]:text-foreground"
        language="sql"
        hideLineNumbers
        value={setupScript}
      />
    </div>
  )
}

export const WarehouseConnectionDetails = ({ onEditTables }: WarehouseConnectionDetailsProps) => {
  const { ref: projectRef } = useParams()

  const {
    data: catalog,
    isPending: isCatalogPending,
    isError: isCatalogError,
    error: catalogError,
  } = useWarehouseCatalogQuery({ projectRef })
  const catalogMutation = useUpdateWarehouseCatalogMutation()

  if (!projectRef) return null

  const endpoint = getWarehouseFlightSqlEndpoint(projectRef)
  const connectionString = getWarehouseFlightSqlConnectionString(projectRef)
  const usqlCommand = getWarehouseUsqlCommand(projectRef)

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Badge variant="success">Warehouse enabled</Badge>
        <button
          type="button"
          onClick={onEditTables}
          className="text-sm text-foreground-light underline underline-offset-2 ml-auto"
        >
          Edit replicated tables
        </button>
      </div>

      <p className="text-sm font-medium text-foreground mb-3">External access</p>
      <div className="flex flex-col gap-3">
        <FieldRow label="Endpoint">
          <CopyValueRow value={endpoint} />
        </FieldRow>
        <FieldRow label="Connection string">
          <CopyValueRow value={connectionString} />
        </FieldRow>
        <FieldRow label="User">
          <CopyValueRow value="postgres" />
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
      </div>

      <div className="h-px bg-border my-6" />

      <p className="text-sm font-medium text-foreground mb-1">Connect with FlightSQL</p>
      <p className="text-sm text-foreground-light max-w-xl mb-3">
        Warehouse speaks the Arrow FlightSQL protocol. Any FlightSQL-compatible client can connect —
        for example, using the <span className="font-mono">usql</span> CLI:
      </p>
      <CodeBlock
        className="[&_code]:text-foreground"
        language="bash"
        hideLineNumbers
        wrapLongLines
        value={usqlCommand}
      />

      <div className="h-px bg-border my-6" />

      <p className="text-sm font-medium text-foreground mb-1">
        Connect with DuckDB (DuckLake catalog)
      </p>

      {isCatalogPending && <GenericSkeletonLoader />}

      {isCatalogError && (
        <AlertError
          className="mt-2"
          subject="Failed to load DuckLake catalog access"
          error={catalogError}
        />
      )}

      {!isCatalogPending && !isCatalogError && !catalog?.enabled && (
        <div className="flex items-center gap-3 mt-2">
          <p className="text-sm text-foreground-light max-w-lg">
            Enable catalog access to attach this project's Warehouse directly from DuckDB.
          </p>
          <Button
            variant="default"
            className="ml-auto shrink-0"
            loading={catalogMutation.isPending}
            onClick={() => catalogMutation.mutate({ projectRef, body: { enabled: true } })}
          >
            Enable catalog access
          </Button>
        </div>
      )}

      {!isCatalogPending && !isCatalogError && catalog?.enabled && catalog.credentials && (
        <DuckLakeSetup credentials={catalog.credentials} />
      )}
    </div>
  )
}
