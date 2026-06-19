import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const TableStorageRedirect: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  useEffect(() => {
    if (ref && id) {
      router.replace(`/project/${ref}/database/tables/${id}`)
    }
  }, [ref, id, router])

  return null
}

TableStorageRedirect.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Tables">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default TableStorageRedirect
