import { useFlag } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DashboardPreferences } from '@/components/interfaces/Settings/General/DashboardPreferences'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const Preferences: NextPageWithLayout = () => {
  const router = useRouter()
  // [Joshen] Using this flag to determine whether to show query preferences or not
  const showQueryPreferences = useFlag('dashboardPreferences')

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.replace('/account/me#dashboard')
    }
  }, [router])

  if (!IS_PLATFORM) return null

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Dashboard</PageHeaderTitle>
            <PageHeaderDescription>
              Configure dashboard query preferences for this project.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">{showQueryPreferences && <DashboardPreferences />}</PageContainer>
    </>
  )
}

Preferences.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="General">{page}</SettingsLayout>
  </DefaultLayout>
)
export default Preferences
