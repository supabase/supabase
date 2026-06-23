import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { TableDetailLayout } from '@/components/layouts/DatabaseLayout/TableDetailLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const TableStorageRedirect: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  useEffect(() => {
    if (ref && id) {
      router.replace(`/project/${ref}/database/tables/${id}/settings`)
    }
  }, [ref, id, router])

  return null
}

TableStorageRedirect.getLayout = (page) => (
  <DefaultLayout>
    <TableDetailLayout section="settings">{page}</TableDetailLayout>
  </DefaultLayout>
)

export default TableStorageRedirect
