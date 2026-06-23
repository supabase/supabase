import { useParams } from 'common'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { TableDetailPoliciesTab } from '@/components/interfaces/Database/Tables/TableDetailPoliciesTab'
import { TableDetailLayout } from '@/components/layouts/DatabaseLayout/TableDetailLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const TableDetailPoliciesPage: NextPageWithLayout = () => {
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

  if (selectedTable === undefined || !isTableLike(selectedTable)) {
    return null
  }

  return <TableDetailPoliciesTab table={selectedTable} />
}

TableDetailPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <TableDetailLayout section="policies">{page}</TableDetailLayout>
  </DefaultLayout>
)

export default TableDetailPoliciesPage
