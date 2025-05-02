import { PermissionAction } from '@supabase/shared-types/out/constants'
import { NoProjectsOnPaidOrgInfo } from 'components/interfaces/Billing/NoProjectsOnPaidOrgInfo'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import OrganizationDeletePanel from './OrganizationDeletePanel'

// Import the new form components
import OrganizationDetailsForm from './OrganizationDetailsForm'
import DataPrivacyForm from './DataPrivacyForm'

const GeneralSettings = () => {
  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')

  const canDeleteOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

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

      {organizationDeletionEnabled && canDeleteOrganization && <OrganizationDeletePanel />}
    </ScaffoldContainer>
  )
}

export default GeneralSettings
