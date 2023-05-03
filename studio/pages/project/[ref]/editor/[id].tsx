import { useTheme } from 'common'
import { useParams } from 'common/hooks'
import { TableGridEditor } from 'components/interfaces'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { TableEditorLayout } from 'components/layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import useTable from 'hooks/misc/useTable'
import { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { isDarkMode } = useTheme()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: selectedTable, isLoading } = useTable(id)

  return (
    <>
      <TableGridEditor
        isLoadingSelectedTable={isLoading}
        selectedTable={selectedTable}
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <DeleteConfirmationDialogs projectRef={projectRef} selectedTable={selectedTable} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <TableEditorLayout>{page}</TableEditorLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
