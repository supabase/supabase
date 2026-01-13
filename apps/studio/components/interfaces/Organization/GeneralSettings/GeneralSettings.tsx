import { NoProjectsOnPaidOrgInfo } from 'components/interfaces/Billing/NoProjectsOnPaidOrgInfo'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { OrganizationDeletePanel } from './OrganizationDeletePanel'

import { DataPrivacyForm } from './DataPrivacyForm'
import { OrganizationDetailsForm } from './OrganizationDetailsForm'

export const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')

  return (
    <ScaffoldContainer>
      <NoProjectsOnPaidOrgInfo />

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Organization Details</ScaffoldSectionTitle>
        <OrganizationDetailsForm />
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Data Privacy</ScaffoldSectionTitle>
        <DataPrivacyForm />
      </ScaffoldSection>

      {organizationDeletionEnabled && <OrganizationDeletePanel />}
    </ScaffoldContainer>
  )
}
