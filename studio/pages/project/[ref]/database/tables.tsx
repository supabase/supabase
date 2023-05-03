import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { ColumnList, TableList } from 'components/interfaces/Database'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { Table, useTableQuery } from 'data/tables/table-query'
import { useStore } from 'hooks'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { NextPageWithLayout } from 'types'

const DatabaseTables: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { meta } = useStore()

  const router = useRouter()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: selectedTable } = useTableQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  useEffect(() => {
    if (project?.ref) {
      meta.types.load()
    }
  }, [project?.ref])

  const setSelectedTable = (table: Table | undefined) => {
    router.replace({
      pathname: router.pathname,
      query: table
        ? {
            ...router.query,
            id: table.id,
          }
        : {
            ...router.query,
            id: undefined, // TODO(alaister): needs full removal of ?id= from the url
          },
    })
  }

  return (
    <>
      <div className="p-4">
        {id !== undefined && selectedTable !== undefined ? (
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
              setSelectedTable(table)
              snap.onEditTable()
            }}
            onDeleteTable={(table) => {
              setSelectedTable(table)
              snap.onDeleteTable()
            }}
            onOpenTable={setSelectedTable}
          />
        )}
      </div>
      <DeleteConfirmationDialogs projectRef={projectRef} selectedTable={selectedTable} />
      <SidePanelEditor selectedTable={selectedTable} />
    </>
  )
}

DatabaseTables.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseTables)
