import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

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

ApiDocsRedirect.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default ApiDocsRedirect
