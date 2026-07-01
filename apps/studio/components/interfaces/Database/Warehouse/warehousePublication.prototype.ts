import type { PGPublication } from '@supabase/pg-meta'

import { SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME } from './managedWarehouse.resources'
import { parseTableKey } from './warehouseNaming.utils'

/** Synthetic ID for the prototype publication row until pg-meta returns the real one. */
export const WAREHOUSE_PROTOTYPE_PUBLICATION_ID = 9_000_001

export function isWarehousePrototypePublication(publication: {
  id: number
  name: string
}): boolean {
  return publication.id === WAREHOUSE_PROTOTYPE_PUBLICATION_ID
}

export function buildWarehousePrototypePublication(linkedTableKeys: string[]): PGPublication {
  return {
    id: WAREHOUSE_PROTOTYPE_PUBLICATION_ID,
    name: SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME,
    owner: 'supabase_admin',
    publish_insert: true,
    publish_update: true,
    publish_delete: true,
    publish_truncate: false,
    tables: linkedTableKeys.map((tableKey, index) => {
      const { schema, table } = parseTableKey(tableKey)

      return {
        id: WAREHOUSE_PROTOTYPE_PUBLICATION_ID + index + 1,
        schema,
        name: table,
      }
    }),
  }
}
