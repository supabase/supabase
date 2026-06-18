import { useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  buildWarehouseCatalogEnv,
  getWarehouseCatalogEngineContent,
  WAREHOUSE_CATALOG_CREDENTIALS,
  WAREHOUSE_CATALOG_ENGINES,
  WAREHOUSE_CATALOG_ENV_VARS,
  type WarehouseCatalogEngine,
} from './warehouseCatalog.constants'
import { EnvRow } from '@/components/interfaces/ConnectSheet/content/server/common/EnvRow'
import CopyButton from '@/components/ui/CopyButton'

interface WarehouseCatalogCredentialsProps {
  queryEngine: WarehouseCatalogEngine
  onQueryEngineChange?: (engine: WarehouseCatalogEngine) => void
}

export function WarehouseCatalogCredentials({
  queryEngine,
  onQueryEngineChange,
}: WarehouseCatalogCredentialsProps) {
  const buildCatalogEnv = useCallback(() => buildWarehouseCatalogEnv(), [])
  const engineContent = getWarehouseCatalogEngineContent(queryEngine)

  return (
    <div className="flex flex-col gap-y-4">
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

      {queryEngine === 'env' ? (
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
            <EnvRow
              name={WAREHOUSE_CATALOG_ENV_VARS.catalogUri}
              value={WAREHOUSE_CATALOG_CREDENTIALS.catalogUri}
            >
              <CopyButton
                variant="default"
                size="tiny"
                iconOnly
                aria-label="Copy catalog URI"
                text={WAREHOUSE_CATALOG_CREDENTIALS.catalogUri}
              />
            </EnvRow>
            <EnvRow
              name={WAREHOUSE_CATALOG_ENV_VARS.accessToken}
              value={WAREHOUSE_CATALOG_CREDENTIALS.accessTokenMasked}
            >
              <CopyButton
                variant="default"
                size="tiny"
                iconOnly
                aria-label="Copy access token"
                text={WAREHOUSE_CATALOG_CREDENTIALS.accessToken}
              />
            </EnvRow>
            <EnvRow
              name={WAREHOUSE_CATALOG_ENV_VARS.warehouseIdentifier}
              value={WAREHOUSE_CATALOG_CREDENTIALS.warehouseId}
            >
              <CopyButton
                variant="default"
                size="tiny"
                iconOnly
                aria-label="Copy warehouse identifier"
                text={WAREHOUSE_CATALOG_CREDENTIALS.warehouseId}
              />
            </EnvRow>
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
