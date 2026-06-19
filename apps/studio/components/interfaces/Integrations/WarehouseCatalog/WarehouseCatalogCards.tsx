import { useState } from 'react'
import { Button, Card, CardContent, CardFooter, Switch } from 'ui'
import { useSnapshot } from 'valtio'

import {
  WAREHOUSE_CATALOG_ENGINES,
  type WarehouseCatalogEngine,
} from './warehouseCatalog.constants'
import { WarehouseCatalogCredentials } from './WarehouseCatalogCredentials'
import {
  setCatalogEnabled,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'

/**
 * Enable/disable card for the Warehouse Catalog integration. Mirrors the Data API
 * enable card: switch + Save/Cancel committing to the demo store.
 */
export const WarehouseCatalogEnableCard = () => {
  const { catalogEnabled } = useSnapshot(warehouseDemoStore)
  const [draft, setDraft] = useState(catalogEnabled)
  const isDirty = draft !== catalogEnabled

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
          <Switch size="large" checked={draft} onCheckedChange={setDraft} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          variant="default"
          disabled={!isDirty}
          onClick={() => setDraft(catalogEnabled)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isDirty}
          onClick={() => setCatalogEnabled(draft)}
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
  const { catalogEnabled } = useSnapshot(warehouseDemoStore)
  const [queryEngine, setQueryEngine] = useState<WarehouseCatalogEngine>(
    WAREHOUSE_CATALOG_ENGINES[0]?.key ?? 'env'
  )

  if (!catalogEnabled) return null

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
        />
      </CardContent>
    </Card>
  )
}
