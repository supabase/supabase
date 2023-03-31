import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions, useStore } from 'hooks'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

interface Props {
  selectedSchema: string
  onAddTable: () => void
}

const EmptyState: FC<Props> = ({ selectedSchema, onAddTable }) => {
  const { meta } = useStore()
  const tables = meta.tables.list((table: PostgresTable) => table.schema === selectedSchema)
  const isProtectedSchema = meta.excludedSchemas.includes(selectedSchema)
  const canCreateTables =
    !isProtectedSchema && checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  return (
    <div className="w-full h-full flex items-center justify-center">
      {tables.length === 0 ? (
        <ProductEmptyState
          title="Table Editor"
          ctaButtonLabel={canCreateTables ? 'Create a new table' : undefined}
          onClickCta={canCreateTables ? onAddTable : undefined}
        >
          <p className="text-sm text-scale-1100">There are no tables available in this schema.</p>
        </ProductEmptyState>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <ProductEmptyState
            title="Table Editor"
            ctaButtonLabel={canCreateTables ? 'Create a new table' : undefined}
            onClickCta={canCreateTables ? onAddTable : undefined}
          >
            <p className="text-sm text-scale-1100">
              Select a table from the navigation panel on the left to view its data
              {canCreateTables && ', or create a new one.'}
            </p>
          </ProductEmptyState>
        </div>
      )}
    </div>
  )
}

export default observer(EmptyState)
