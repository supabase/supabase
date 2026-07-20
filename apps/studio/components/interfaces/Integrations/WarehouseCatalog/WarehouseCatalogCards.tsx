import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardFooter, Switch } from 'ui'

import {
  WAREHOUSE_CATALOG_ENGINES,
  type WarehouseCatalogEngine,
} from './warehouseCatalog.constants'
import { WarehouseCatalogCredentials } from './WarehouseCatalogCredentials'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'

/**
 * Enable/disable card for the Warehouse Catalog integration. Mirrors the Data API enable card:
 * switch + Save/Cancel committing to the catalog endpoint.
 */
export const WarehouseCatalogEnableCard = () => {
  const { ref: projectRef } = useParams()
  const { data: catalog } = useWarehouseCatalogQuery({ projectRef })
  const enabled = catalog?.enabled ?? false

  const [draft, setDraft] = useState(enabled)
  // Keep the draft in sync once the current value loads or changes elsewhere.
  useEffect(() => setDraft(enabled), [enabled])

  const { mutate: updateCatalog, isPending } = useUpdateWarehouseCatalogMutation()
  const isDirty = draft !== enabled

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground">Enable Warehouse Catalog</span>
            <span className="text-sm text-foreground-lighter text-balance">
              When enabled, analytics tools can connect directly to Warehouse tables using catalog
              credentials. Access is managed independently from your database connection settings.
            </span>
          </div>
          <Switch size="large" checked={draft} onCheckedChange={setDraft} disabled={isPending} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          variant="default"
          disabled={!isDirty || isPending}
          onClick={() => setDraft(enabled)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isPending}
          disabled={!isDirty || !projectRef}
          onClick={() => {
            if (!projectRef) return
            updateCatalog({ projectRef, enabled: draft })
          }}
        >
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Catalog credentials card. Only rendered once the catalog is enabled.
 */
export const WarehouseCatalogCredentialsCard = () => {
  const { ref: projectRef } = useParams()
  const { data: catalog } = useWarehouseCatalogQuery({ projectRef })
  const [queryEngine, setQueryEngine] = useState<WarehouseCatalogEngine>(
    WAREHOUSE_CATALOG_ENGINES[0]?.key ?? 'env'
  )

  if (!catalog?.enabled) return null

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Catalog credentials</span>
          <span className="text-sm text-foreground-lighter">
            Connect external query engines to your Warehouse tables.
          </span>
        </div>
        <WarehouseCatalogCredentials
          queryEngine={queryEngine}
          onQueryEngineChange={setQueryEngine}
          credentials={catalog.credentials}
        />
      </CardContent>
    </Card>
  )
}
