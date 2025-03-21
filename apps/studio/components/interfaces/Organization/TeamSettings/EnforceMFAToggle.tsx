import { Toggle } from 'ui'
import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import Panel from 'components/ui/Panel'
import { useOrganizationMfaQuery } from 'data/organizations/organization-mfa-query'
import { useOrganizationMfaToggleMutation } from 'data/organizations/organization-mfa-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useAppStateSnapshot } from 'state/app-state'

const EnforceMFAToggle = () => {
  const { slug } = useParams()
  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const {
    data: mfa,
    error: mfaError,
    isLoading: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug })
  const { mutate: sendToggle } = useOrganizationMfaToggleMutation()

  const snap = useAppStateSnapshot()
  const onToggleMfa = () => {
    const value = !snap.isMfaEnforced ? 'true' : 'false'
    snap.setIsMfaEnforced(value === 'true')
    sendToggle({ slug: slug, enforced: value === 'true' })
  }

  return (
    <>
      {isLoadingMfa && <GenericSkeletonLoader />}
      {isSuccessMfa && (
        <Panel title={<h5 key="panel-title">Team Settings</h5>}>
          <Panel.Content>
            <Toggle
              checked={snap.isMfaEnforced}
              onChange={onToggleMfa}
              disabled={!canUpdateOrganization}
              label="Require MFA to access organization"
              descriptionText="Team members must have MFA enabled and a valid MFA session to access the organization and any projects."
            />
          </Panel.Content>
        </Panel>
      )}
    </>
  )
}

export default EnforceMFAToggle
