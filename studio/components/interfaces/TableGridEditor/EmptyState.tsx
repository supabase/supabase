import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useCheckPermissions, useLocalStorage, useStore } from 'hooks'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

interface Props {
  selectedSchema: string
  onAddTable: () => void
}

const EmptyState: FC<Props> = ({ selectedSchema, onAddTable }) => {
  const { meta } = useStore()
  const isProtectedSchema = meta.excludedSchemas.includes(selectedSchema)
  const canCreateTables =
    useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables') && !isProtectedSchema

  const [sort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { project } = useProjectContext()
  const { data } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
      sort,
    },
    {
      keepPreviousData: true,
    }
  )

  const totalCount = data?.pages?.[0].data.count ?? 0

  return (
    <div className="w-full h-full flex items-center justify-center">
      {totalCount === 0 ? (
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
