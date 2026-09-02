import { useParams } from 'common'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  isSecretWarehouseCatalogField,
  maskSecretValue,
  type WarehouseCatalogCredentials,
} from './WarehouseModePanel.utils'
import { AlertError } from '@/components/ui/AlertError'
import CopyButton from '@/components/ui/CopyButton'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'
import {
  getDuckLakeAttachSnippet,
  getWarehouseFlightSqlConnectionString,
  getWarehouseFlightSqlEndpoint,
  getWarehouseUsqlCommand,
} from '@/lib/warehouse'

export interface WarehouseConnectionDetailsProps {
  onEditTables: () => void
}

const CATALOG_FIELD_LABELS: Record<keyof WarehouseCatalogCredentials, string> = {
  s3_endpoint: 'S3 endpoint',
  s3_region: 'S3 region',
  s3_access_key_id: 'S3 access key ID',
  s3_secret_access_key: 'S3 secret access key',
  catalog_url: 'Catalog URL',
  data_path: 'Data path',
  metadata_schema: 'Metadata schema',
}

// Only the S3 credentials are surfaced individually — DuckDB needs them to read the data files.
// catalog_url, data_path and metadata_schema are already embedded in the ATTACH snippet above, so
// repeating catalog_url as a masked row would be pure theater: the snippet shows it in full.
const CATALOG_FIELDS_TO_DISPLAY: (keyof WarehouseCatalogCredentials)[] = [
  's3_endpoint',
  's3_region',
  's3_access_key_id',
  's3_secret_access_key',
]

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 items-center">
      <span className="text-sm text-foreground-light">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function CopyValueRow({ value, mono = true }: { value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-control">
      <span
        className={cn('flex-1 truncate text-sm text-foreground', mono && 'font-mono')}
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
      />
    </div>
  )
}

function MaskedCopyValueRow({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-control">
      <span className="flex-1 truncate text-sm font-mono text-foreground-lighter">
        {maskSecretValue(value)}
      </span>
      <CopyButton
        variant="default"
        size="tiny"
        iconOnly
        asyncText={() => value}
        aria-label="Copy secret value"
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
      <CodeBlock language="bash" hideLineNumbers value={usqlCommand}>
        {usqlCommand}
      </CodeBlock>

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
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-sm text-foreground-light max-w-lg mb-1">
            Attach this project's Warehouse directly from DuckDB using the DuckLake catalog:
          </p>
          <CodeBlock
            language="sql"
            hideLineNumbers
            value={getDuckLakeAttachSnippet(catalog.credentials)}
          >
            {getDuckLakeAttachSnippet(catalog.credentials)}
          </CodeBlock>
          {CATALOG_FIELDS_TO_DISPLAY.map((field) => {
            const value = catalog.credentials![field]
            return (
              <FieldRow key={field} label={CATALOG_FIELD_LABELS[field]}>
                {isSecretWarehouseCatalogField(field) ? (
                  <MaskedCopyValueRow value={value} />
                ) : (
                  <CopyValueRow value={value} />
                )}
              </FieldRow>
            )
          })}
        </div>
      )}
    </div>
  )
}
