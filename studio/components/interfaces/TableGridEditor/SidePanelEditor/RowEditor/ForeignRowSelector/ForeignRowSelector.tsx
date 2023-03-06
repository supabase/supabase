import { PostgresTable } from '@supabase/postgres-meta'
import { parseSupaTable } from 'components/grid'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useStore } from 'hooks'
import { IconLoader, SidePanel } from 'ui'

import ActionBar from '../../ActionBar'
import { RowField } from '../RowEditor.types'
import { useEncryptedColumns } from './ForeignRowSelector.utils'
import SelectorTable from './SelectorTable'

export interface ForeignRowSelectorProps {
  visible: boolean
  referenceRow?: RowField
  onSelect: (value: any) => void
  closePanel: () => void
}

const ForeignRowSelector = ({
  visible,
  referenceRow,
  onSelect,
  closePanel,
}: ForeignRowSelectorProps) => {
  const { meta } = useStore()
  const { project } = useProjectContext()

  const {
    target_table_schema: schemaName,
    target_table_name: tableName,
    target_column_name: columnName,
  } = referenceRow?.foreignKey ?? {}

  const tables = meta.tables.list()
  const table = tables.find((table) => table.schema === schemaName && table.name === tableName)
  const encryptedColumns = useEncryptedColumns({ schemaName, tableName })

  const supaTable =
    table &&
    parseSupaTable(
      {
        table: table as PostgresTable,
        columns: (table as PostgresTable).columns ?? [],
        primaryKeys: (table as PostgresTable).primary_keys,
        relationships: (table as PostgresTable).relationships,
      },
      encryptedColumns
    )

  const { data, isLoading, isSuccess, isError } = useTableRowsQuery(
    {
      queryKey: [schemaName, tableName],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table: supaTable,
      // sorts,
      // filters,
      // page: state.page,
      // limit: state.rowsPerPage,
    },
    {
      keepPreviousData: true,
    }
  )

  return (
    <SidePanel
      visible={visible}
      size="large"
      header={
        <div>
          Selecting foreign key from{' '}
          <code className="text-sm">
            {schemaName}.{tableName}
          </code>
        </div>
      }
      hideFooter={false}
      onCancel={closePanel}
      customFooter={<ActionBar hideApply backButtonLabel="Close" closePanel={closePanel} />}
    >
      <SidePanel.Content className="h-full !px-0">
        <div className="h-full">
          {isLoading && (
            <div className="flex h-full py-6 flex-col items-center justify-center space-y-2">
              <IconLoader className="animate-spin" />
              <p className="text-sm text-scale-1100">Loading rows</p>
            </div>
          )}

          {isError && (
            <div className="flex h-full py-6 flex-col items-center justify-center">
              <p className="text-sm text-scale-1100">
                Unable to load rows from{' '}
                <code>
                  {schemaName}.{tableName}
                </code>
                . Please try again or contact support.
              </p>
            </div>
          )}

          {isSuccess && supaTable && (
            <SelectorTable
              table={supaTable}
              rows={data?.rows ?? []}
              onRowSelect={(row) => onSelect(row[columnName ?? ''])}
            />
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ForeignRowSelector
