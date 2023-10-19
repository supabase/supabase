import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { ColumnList, TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { Table } from 'data/tables/table-query'
import { useStore } from 'hooks'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()

  const snap = useTableEditorStateSnapshot()
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined)

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.types.load()
    }
  }, [ui.selectedProjectRef])

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            {selectedTable === undefined ? (
              <TableList
                onAddTable={snap.onAddTable}
                onEditTable={() => {
                  snap.onEditTable()
                }}
                onDeleteTable={snap.onDeleteTable}
                onOpenTable={setSelectedTable}
              />
            ) : (
              <ColumnList
                table={selectedTable}
                onAddColumn={snap.onAddColumn}
                onEditColumn={snap.onEditColumn}
                onDeleteColumn={snap.onDeleteColumn}
                onSelectBack={() => setSelectedTable(undefined)}
              />
            )}
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteConfirmationDialogs projectRef={projectRef} selectedTable={selectedTable} />
      <SidePanelEditor selectedTable={selectedTable} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseTables)
