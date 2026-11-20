import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFlag } from 'common'
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
import { IS_PLATFORM } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/settings/dashboard')({
  component: Preferences,
  staticData: { settingsLayoutTitle: 'General' },
})

function Preferences() {
  const navigate = useNavigate()
  // [Joshen] Using this flag to determine whether to show query preferences or not
  const showQueryPreferences = useFlag('dashboardPreferences')

  useEffect(() => {
    if (!IS_PLATFORM) {
      void navigate({ to: '/account/me', hash: 'dashboard', replace: true })
    }
  }, [navigate])

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
