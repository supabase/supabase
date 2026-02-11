import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

const ApiSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    router.replace(`/project/${ref}/integrations/data_api/overview`)
  }, [ref, router])

  return null
}

export default ApiSettings
