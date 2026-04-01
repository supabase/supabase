import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DataPrivacyForm } from './DataPrivacyForm'
import { OrganizationDeletePanel } from './OrganizationDeletePanel'
import { OrganizationDetailsForm } from './OrganizationDetailsForm'
import { NoProjectsOnPaidOrgInfo } from '@/components/interfaces/Billing/NoProjectsOnPaidOrgInfo'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')

  return (
    <>
      <NoProjectsOnPaidOrgInfo />

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Organization details</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <OrganizationDetailsForm />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Data privacy</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <DataPrivacyForm />
        </PageSectionContent>
      </PageSection>

      {organizationDeletionEnabled && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Danger zone</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <OrganizationDeletePanel />
          </PageSectionContent>
        </PageSection>
      )}
    </>
  )
}
