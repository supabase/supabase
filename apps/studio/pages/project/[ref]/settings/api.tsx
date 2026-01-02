import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const ApiSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    router.replace(`/project/${ref}/integrations/data_api/overview`)
  }, [ref, router])

  return null
}

ApiSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="API Settings">
      <PageLayout title="API Settings">{page}</PageLayout>
    </SettingsLayout>
  </DefaultLayout>
)
export default ApiSettings
