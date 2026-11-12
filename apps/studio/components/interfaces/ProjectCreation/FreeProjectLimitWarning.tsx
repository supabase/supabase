import { useParams } from 'common'
import { Admonition } from 'ui-patterns/Admonition'

import { AffectedOrganizationsList } from '@/components/ui/AffectedOrganizationsList'
import { FreeProjectLimitActions } from '@/components/ui/FreeProjectLimitActions'
import Panel from '@/components/ui/Panel'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import type { MemberWithFreeProjectLimit } from '@/data/organizations/free-project-limit-check-query'
import { groupByOrganization } from '@/data/organizations/free-project-limit-check.utils'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'

interface FreeProjectLimitWarningProps {
  membersExceededLimit: MemberWithFreeProjectLimit[]
}

export const FreeProjectLimitWarning = ({ membersExceededLimit }: FreeProjectLimitWarningProps) => {
  const { slug } = useParams()
  const { data: orgMembers } = useOrganizationMembersQuery({ slug })
  const hasMultipleMembers = (orgMembers ?? []).filter((member) => !member.invited_id).length > 1
  const organizations = groupByOrganization(membersExceededLimit)

  return (
    <Panel.Content>
      <Admonition
        type="default"
        title="Exceeding number of active Free Projects"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Owners and administrators are limited in how many active Free Plan projects they can
              have across all organizations. These members are over the limit:
            </p>
            <AffectedOrganizationsList organizations={organizations} />
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
