import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildWarehouseCatalogEnv,
  getWarehouseCatalogEngineContent,
  WAREHOUSE_CATALOG_ENGINES,
  WAREHOUSE_CATALOG_ENV_VARS,
  type WarehouseCatalogEngine,
} from './warehouseCatalog.constants'
import { EnvRow } from '@/components/interfaces/ConnectSheet/content/server/common/EnvRow'
import CopyButton from '@/components/ui/CopyButton'
import type { WarehouseCatalogCredentials as CatalogCredentials } from '@/data/warehouse/warehouse-catalog-query'

interface WarehouseCatalogCredentialsProps {
  queryEngine: WarehouseCatalogEngine
  onQueryEngineChange?: (engine: WarehouseCatalogEngine) => void
  credentials?: CatalogCredentials
}

function maskSecret(secret: string): string {
  if (secret.length <= 4) return '••••••'
  return `${secret.slice(0, 3)}${'•'.repeat(14)}`
}

export function WarehouseCatalogCredentials({
  queryEngine,
  onQueryEngineChange,
  credentials,
}: WarehouseCatalogCredentialsProps) {
  const buildCatalogEnv = useCallback(
    () => (credentials ? buildWarehouseCatalogEnv(credentials) : ''),
    [credentials]
  )

  const engineContent = credentials
    ? getWarehouseCatalogEngineContent(queryEngine, credentials)
    : undefined

  // Rows shown for the "Environment variables" view. The S3 secret is masked (copy reveals it).
  const envRows = credentials
    ? [
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.catalogUrl,
          value: credentials.catalogUrl,
          copy: credentials.catalogUrl,
          label: 'catalog URL',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.dataPath,
          value: credentials.dataPath,
          copy: credentials.dataPath,
          label: 'data path',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.s3Endpoint,
          value: credentials.s3Endpoint,
          copy: credentials.s3Endpoint,
          label: 'S3 endpoint',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.s3Region,
          value: credentials.s3Region,
          copy: credentials.s3Region,
          label: 'S3 region',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.s3AccessKeyId,
          value: credentials.s3AccessKeyId,
          copy: credentials.s3AccessKeyId,
          label: 'S3 access key ID',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.s3SecretAccessKey,
          value: maskSecret(credentials.s3SecretAccessKey),
          copy: credentials.s3SecretAccessKey,
          label: 'S3 secret access key',
        },
        {
          name: WAREHOUSE_CATALOG_ENV_VARS.metadataSchema,
          value: credentials.metadataSchema,
          copy: credentials.metadataSchema,
          label: 'metadata schema',
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-y-4">
      <Admonition
        type="default"
        title="Read-only access"
        description="Warehouse Catalog credentials can only be used to query Warehouse tables for now. Writes through external DuckLake clients are not supported yet."
      />

      {onQueryEngineChange && (
        <FormItemLayout isReactForm={false} layout="horizontal" label="Query engine">
          <Select
            value={queryEngine}
            onValueChange={(v) => onQueryEngineChange(v as WarehouseCatalogEngine)}
          >
            <SelectTrigger
              size="small"
              className="[&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-x-2"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSE_CATALOG_ENGINES.map((engine) => (
                <SelectItem key={engine.key} value={engine.key}>
                  {engine.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}

      {!credentials || !engineContent ? (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" delayIndex={1} />
        </div>
      ) : queryEngine === 'env' ? (
        <div className="overflow-hidden rounded-lg border bg-surface-100">
          <div className="flex items-center justify-between border-b bg-surface-200 px-4 py-2">
            <span className="font-mono text-xs text-foreground-light">catalog.env</span>
            <CopyButton
              variant="default"
              size="tiny"
              asyncText={buildCatalogEnv}
              aria-label="Copy all variables"
            />
          </div>
          <div className="divide-y">
            {envRows.map((row) => (
              <EnvRow key={row.name} name={row.name} value={row.value}>
                <CopyButton
                  variant="default"
                  size="tiny"
                  iconOnly
                  aria-label={`Copy ${row.label}`}
                  text={row.copy}
                />
              </EnvRow>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface-100">
          <div className="flex items-center justify-between border-b bg-surface-200 px-4 py-2">
            <span className="font-mono text-xs text-foreground-light">
              {engineContent.headerLabel}
            </span>
            <CopyButton
              variant="default"
              size="tiny"
              text={engineContent.value}
              aria-label="Copy configuration"
            />
          </div>
          <CodeBlock
            className="rounded-none border-0 [&_code]:text-foreground"
            wrapperClassName="rounded-none"
            value={engineContent.value}
            hideLineNumbers
            language={engineContent.language}
          />
        </div>
      )}
    </div>
  )
}
