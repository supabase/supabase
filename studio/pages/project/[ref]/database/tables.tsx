import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { ColumnList, TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Table } from 'data/tables/table-query'
import { useStore } from 'hooks'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { meta } = useStore()

  const { ref: projectRef } = useParams()

  useEffect(() => {
    if (project?.ref) {
      meta.types.load()
    }
  }, [project?.ref])

  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<Table | undefined>(undefined)

  return (
    <>
      <div className="p-4">
        {selectedTable !== undefined ? (
          <ColumnList
            selectedTable={selectedTable}
            onAddColumn={snap.onAddColumn}
            onEditColumn={snap.onEditColumn}
            onDeleteColumn={snap.onDeleteColumn}
            onSelectBack={() => setSelectedTable(undefined)}
          />
        ) : (
          <TableList
            onAddTable={snap.onAddTable}
            onEditTable={(table) => {
              setSelectedTableToEdit(table)
              snap.onEditTable()
            }}
            onDeleteTable={(table) => {
              setSelectedTableToEdit(table)
              snap.onDeleteTable()
            }}
            onOpenTable={setSelectedTable}
          />
        )}
      </div>
      <DeleteConfirmationDialogs projectRef={projectRef} selectedTable={selectedTableToEdit} />
      <SidePanelEditor selectedTable={selectedTableToEdit} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseTables)
