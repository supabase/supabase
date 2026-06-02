import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

const LogsExplorerTemplatesRedirectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref || !router.isReady) return
    router.replace(`/project/${ref}/sql/templates?source=logs`)
  }, [ref, router])

  return null
}

export default LogsExplorerTemplatesRedirectPage
