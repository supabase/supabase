import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import DefaultLayout from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const ObservabilityReportRedirectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  useEffect(() => {
    if (!ref || !id || !router.isReady) return
    router.replace(`/project/${ref}/sql/notebooks/${id}`)
  }, [ref, id, router])

  return null
}

ObservabilityReportRedirectPage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default ObservabilityReportRedirectPage
