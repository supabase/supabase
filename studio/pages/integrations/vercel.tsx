import { useEffect } from 'react'

import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'types'

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    router.push({ pathname: '/integrations/vercel/install', query: router.query })
  }, [router])

  return <></>
}

VercelIntegration.getLayout = (page) => <IntegrationWindowLayout>{page}</IntegrationWindowLayout>

export default VercelIntegration
