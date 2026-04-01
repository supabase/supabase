import { useFlag } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DashboardSettingsToggles } from '@/components/interfaces/Account/Preferences/DashboardSettingsToggles'
import { QueryPreferences } from '@/components/interfaces/Settings/General/QueryPreferences'

const Preferences: NextPageWithLayout = () => {
  // [Joshen] Using this flag to determine whether to show query preferences or not
  const showQueryPreferences = useFlag('dashboardPreferences')

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Dashboard</PageHeaderTitle>
            <PageHeaderDescription>
              General dashboard preferences for your project
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        {IS_PLATFORM && showQueryPreferences && <QueryPreferences />}

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle id="edits">Edits</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <DashboardSettingsToggles />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

Preferences.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="General">{page}</SettingsLayout>
  </DefaultLayout>
)
export default Preferences
