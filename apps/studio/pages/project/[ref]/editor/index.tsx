import { useRouter } from 'next/router'

import { useParams } from 'common'
import { EmptyState, SidePanelEditor } from 'components/interfaces/TableGridEditor'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import type { Table } from 'data/tables/table-query'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const onTableCreated = (table: Table) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  return (
    <>
      <EmptyState />
      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <TableEditorLayout>{page}</TableEditorLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
