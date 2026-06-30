import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseTableDetailStorageTab } from '@/components/interfaces/Database/Warehouse/WarehouseTableDetailStorageTab'
import { TableDetailLayout } from '@/components/layouts/DatabaseLayout/TableDetailLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableDetailWarehouseView } from '@/hooks/misc/useTableDetailWarehouseView'
import type { NextPageWithLayout } from '@/types'

const TableStoragePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const { isWarehouseDetailView } = useTableDetailWarehouseView(selectedTable?.schema)

  useEffect(() => {
    if (isWarehouseDetailView || !ref || !id) return
    router.replace(`/project/${ref}/database/tables/${id}/settings`)
  }, [id, isWarehouseDetailView, ref, router])

  if (isPending) {
    return <ShimmeringLoader />
  }

  if (selectedTable === undefined || !isTableLike(selectedTable)) {
    return null
  }

  if (!isWarehouseDetailView) {
    return null
  }

  return <WarehouseTableDetailStorageTab table={selectedTable} />
}

TableStoragePage.getLayout = (page) => (
  <DefaultLayout>
    <TableDetailLayout section="storage">{page}</TableDetailLayout>
  </DefaultLayout>
)

export default TableStoragePage
