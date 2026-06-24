import { useParams } from 'common'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ColumnList } from '@/components/interfaces/Database/Tables/ColumnList'
import { TableDetailColumnsTab } from '@/components/interfaces/Database/Tables/TableDetailColumnsTab'
import { TableDetailLayout } from '@/components/layouts/DatabaseLayout/TableDetailLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import type { NextPageWithLayout } from '@/types'

const TableDetailColumnsPage: NextPageWithLayout = () => {
  const snap = useTableEditorStateSnapshot()
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  if (isPending) {
    return <ShimmeringLoader />
  }

  if (selectedTable === undefined) {
    return null
  }

  if (isTableLike(selectedTable)) {
    return (
      <TableDetailColumnsTab
        onAddColumn={snap.onAddColumn}
        onEditColumn={snap.onEditColumn}
        onDeleteColumn={snap.onDeleteColumn}
      />
    )
  }

  return (
    <ColumnList
      onAddColumn={snap.onAddColumn}
      onEditColumn={snap.onEditColumn}
      onDeleteColumn={snap.onDeleteColumn}
    />
  )
}

TableDetailColumnsPage.getLayout = (page) => (
  <DefaultLayout>
    <TableDetailLayout section="columns">{page}</TableDetailLayout>
  </DefaultLayout>
)

export default TableDetailColumnsPage
