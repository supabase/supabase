import { useParams } from 'common'
import { Admonition } from 'ui-patterns/Admonition'

import { ExceedFreeProjectLimitMembers } from '@/components/ui/ExceedFreeProjectLimitMembers'
import { FreeProjectLimitActions } from '@/components/ui/FreeProjectLimitActions'
import Panel from '@/components/ui/Panel'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import type { MemberWithFreeProjectLimit } from '@/data/organizations/free-project-limit-check-query'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'

interface FreeProjectLimitWarningProps {
  membersExceededLimit: MemberWithFreeProjectLimit[]
}

export const FreeProjectLimitWarning = ({ membersExceededLimit }: FreeProjectLimitWarningProps) => {
  const { slug } = useParams()
  const { data: orgMembers } = useOrganizationMembersQuery({ slug })
  const hasMultipleMembers = (orgMembers ?? []).filter((member) => !member.invited_id).length > 1

  return (
    <Panel.Content>
      <Admonition
        type="default"
        title="Unable to create project under Free Plan organization"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Owners and administrators are limited in how many active Free Plan projects they can
              have across all organizations.
            </p>

            <ExceedFreeProjectLimitMembers membersExceededLimit={membersExceededLimit} />

            <FreeProjectLimitActions
              goal="create a free project in this organization"
              hasMultipleMembers={hasMultipleMembers}
            />

            <div className="mt-4">
              <UpgradePlanButton
                source="freeProjectLimitWarning"
                featureProposition="create more projects"
              />
            </div>
          </div>
        }
      />
    </Panel.Content>
  )
}
