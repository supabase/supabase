import { cn, Collapsible_Shadcn_, CollapsibleTrigger_Shadcn_, CollapsibleContent_Shadcn_ } from 'ui'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

import { Toggle } from 'ui'
import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import Panel from 'components/ui/Panel'
import { useOrganizationMfaQuery } from 'data/organizations/organization-mfa-query'
import { useOrganizationMfaToggleMutation } from 'data/organizations/organization-mfa-mutation'

const EnforceMFAToggle = () => {
  const { slug } = useParams()
  const {
    data: mfa,
    error: mfaError,
    isLoading: isLoadingMfa,
    isError: isErrorMfa,
    isSuccess: isSuccessMfa,
  } = useOrganizationMfaQuery({ slug })
  const { mutate: sendToggle } = useOrganizationMfaToggleMutation()

  let mfaEnabled = mfa
  const onToggleMfa = () => {
    mfaEnabled = !mfaEnabled
    sendToggle({ slug: slug, enforced: mfaEnabled })
  }

  return (
    <>
      {isLoadingMfa && <GenericSkeletonLoader />}
      {isSuccessMfa && (
        <Panel title={<h5 key="panel-title">Team Settings</h5>}>
          <Panel.Content>
            <Toggle
              checked={mfaEnabled}
              onChange={onToggleMfa}
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
