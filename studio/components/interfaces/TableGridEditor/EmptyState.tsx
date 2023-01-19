import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useTablesQuery } from 'data/tables/tables-query'
import { checkPermissions } from 'hooks'
import { SYSTEM_SCHEMAS } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { IconLoader } from 'ui'

interface Props {
  selectedSchema: string
  onAddTable: () => void
}

const EmptyState: FC<Props> = ({ selectedSchema, onAddTable }) => {
  const { project } = useProjectContext()

  const {
    data: tablesData,
    isLoading: isLoadingTables,
    isSuccess: isSuccessTables,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
  })

  const tables = tablesData?.result ?? []

  const isProtectedSchema = SYSTEM_SCHEMAS.includes(selectedSchema)
  const canCreateTables =
    !isProtectedSchema && checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isLoadingTables && (
        <ProductEmptyState title="Table Editor">
          <div className="flex flex-col items-center justify-center">
            <IconLoader className="animate-spin" size={14} strokeWidth={1.5} />
            <span className="text-sm text-scale-900">Loading tables...</span>
          </div>
        </ProductEmptyState>
      )}

      {isSuccessTables &&
        (tables.length <= 0 ? (
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
        ))}
    </div>
  )
}

export default observer(EmptyState)
