import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import type { WarehouseCatalogEngine } from '@/components/interfaces/Integrations/WarehouseCatalog/warehouseCatalog.constants'
import { WarehouseCatalogCredentials } from '@/components/interfaces/Integrations/WarehouseCatalog/WarehouseCatalogCredentials'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'

interface WarehouseCatalogPanelProps {
  queryEngine?: WarehouseCatalogEngine
}

export function WarehouseCatalogPanel({ queryEngine = 'env' }: WarehouseCatalogPanelProps) {
  const { ref: projectRef } = useParams()
  const { data: catalog } = useWarehouseCatalogQuery({ projectRef })
  const catalogEnabled = catalog?.enabled ?? false

  return (
    <div className="flex flex-col divide-y">
      <div className="p-8">
        {!catalogEnabled ? (
          <Admonition
            type="warning"
            layout="responsive"
            title="Catalog access is disabled"
            description="Enable the Warehouse catalog integration to reveal credentials."
            actions={[
              <Button asChild key="enable" variant="default">
                <Link href={`/project/${projectRef}/integrations/warehouse_catalog/overview`}>
                  Enable integration
                </Link>
              </Button>,
            ]}
          />
        ) : (
          <WarehouseCatalogCredentials
            queryEngine={queryEngine}
            credentials={catalog?.credentials}
          />
        )}
      </div>
    </div>
  )
}
