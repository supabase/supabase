import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions, useStore } from 'hooks'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

interface Props {
  selectedSchema: string
  onAddTable: () => void
}

const EmptyState: FC<Props> = ({ selectedSchema, onAddTable }) => {
  const { meta } = useStore()

  const { project } = useProjectContext()
  const { data, isLoading } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
      search: undefined,
    },
    {
      keepPreviousData: true,
    }
  )
  const totalCount = data?.pages?.[0].data.count

  const isProtectedSchema = meta.excludedSchemas.includes(selectedSchema)
  const canCreateTables =
    !isProtectedSchema && checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isLoading ? (
        <div className="py-4 space-y-2 w-[370px] rounded border border-panel-border-light bg-panel-body-light p-6 shadow-md dark:border-panel-border-dark dark:bg-panel-body-dark">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : totalCount === 0 ? (
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
