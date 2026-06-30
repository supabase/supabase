import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import {
  buildTableDetailUrl,
  isWarehouseTableDetailView,
  WAREHOUSE_TABLE_DETAIL_VIEW,
} from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'

export function useTableDetailWarehouseView(tableSchema?: string) {
  const router = useRouter()
  const viewFromQuery = typeof router.query.view === 'string' ? router.query.view : undefined
  const isWarehouseDetailView = isWarehouseTableDetailView({
    viewFromQuery,
    tableSchema,
  })

  return { isWarehouseDetailView, viewFromQuery }
}

export function useRedirectWarehouseDetailFromSubroutes(tableSchema?: string) {
  const router = useRouter()
  const { ref, id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { isWarehouseDetailView } = useTableDetailWarehouseView(tableSchema)

  useEffect(() => {
    if (!isWarehouseDetailView || !ref || id === undefined) return
    router.replace(
      buildTableDetailUrl(ref, id, { view: WAREHOUSE_TABLE_DETAIL_VIEW, section: 'overview' })
    )
  }, [id, isWarehouseDetailView, ref, router])
}
