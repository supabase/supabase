import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const ComputeAndDiskRedirect: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    const hash = router.asPath.split('#')[1]
    router.replace(`/project/${ref}/settings/infrastructure${hash ? `#${hash}` : ''}`)
  }, [ref, router])

  return null
}

ComputeAndDiskRedirect.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)

export default ComputeAndDiskRedirect
