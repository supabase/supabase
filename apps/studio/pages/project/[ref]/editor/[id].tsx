import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useParams } from 'common/hooks'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { TablesData } from 'data/tables/tables-query'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined

  const { project } = useProjectContext()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const router = useRouter()
  const onAfterDeleteTable = useCallback(
    (tables: TablesData) => {
      // For simplicity for now, we just open the first table within the same schema
      if (tables.length > 0) {
        router.push(`/project/${projectRef}/editor/${tables[0].id}`)
      } else {
        router.push(`/project/${projectRef}/editor`)
      }
    },
    [router, projectRef]
  )

  return (
    <>
      <TableGridEditor isLoadingSelectedTable={isLoading} selectedTable={selectedTable} />
      <DeleteConfirmationDialogs
        selectedTable={selectedTable}
        onAfterDeleteTable={onAfterDeleteTable}
      />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <DefaultLayout>
    <TableEditorLayout>{page}</TableEditorLayout>
  </DefaultLayout>
)

export default TableEditorPage
