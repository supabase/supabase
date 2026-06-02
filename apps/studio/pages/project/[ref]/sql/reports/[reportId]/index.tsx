import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

/** @deprecated Use /sql/notebooks/[notebookId] */
const LegacyReportRedirectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, reportId } = useParams()

  useEffect(() => {
    if (!ref || !reportId || !router.isReady) return
    router.replace(`/project/${ref}/sql/notebooks/${reportId}`)
  }, [ref, reportId, router])

  return null
}

export default LegacyReportRedirectPage
