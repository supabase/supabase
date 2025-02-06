import { useRouter } from 'next/router'

import { useParams } from 'common'

import EmptyState from 'components/interfaces/TableGridEditor/EmptyState'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const onTableCreated = (table: { id: number }) => {
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
  <DefaultLayout>
    <TableEditorLayout>{page}</TableEditorLayout>
  </DefaultLayout>
)

export default TableEditorPage
