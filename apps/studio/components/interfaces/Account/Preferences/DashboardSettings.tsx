import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DashboardSettingsToggles } from './DashboardSettingsToggles'

export const DashboardSettings = () => {
  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="dashboard">Dashboard</PageSectionTitle>
          <PageSectionDescription>
            Customize how the dashboard works on this browser and device.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <DashboardSettingsToggles />
      </PageSectionContent>
    </PageSection>
  )
}
