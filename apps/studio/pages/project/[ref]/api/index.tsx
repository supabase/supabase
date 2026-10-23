import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

const ApiDocsRedirect: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!router.isReady || !ref) return
    const { ref: _ref, ...query } = router.query
    router.replace({
      pathname: `/project/${ref}/integrations/data_api/docs`,
      query,
    })
  }, [router, ref])

  return null
}

ApiDocsRedirect.getLayout = (page) => <>{page}</>

export default ApiDocsRedirect
