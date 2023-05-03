import { EmptyState } from 'components/interfaces/TableGridEditor'
import { TableEditorLayout } from 'components/layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  return <EmptyState />
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <TableEditorLayout>{page}</TableEditorLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
