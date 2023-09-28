import Link from 'next/link'
import { Button, IconAlertCircle } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import { MemberWithFreeProjectLimit } from 'data/organizations/free-project-limit-check-query'

interface FreeProjectLimitWarningProps {
  membersExceededLimit: MemberWithFreeProjectLimit[]
  orgLevelBilling: boolean
  orgSlug: string
}

const FreeProjectLimitWarning = ({
  membersExceededLimit,
  orgLevelBilling,
  orgSlug,
}: FreeProjectLimitWarningProps) => {
  return (
    <div>
      <InformationBox
        icon={<IconAlertCircle className="text-scale-1200" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="The organization has members who have exceeded their free project limits"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              The following members have reached their maximum limits for the number of active free
              plan projects within organizations where they are an administrator or owner:
            </p>
            <ul className="pl-5 list-disc">
              {membersExceededLimit.map((member, idx: number) => (
                <li key={`member-${idx}`}>
                  {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                  projects)
                </li>
              ))}
            </ul>
            <p className="text-sm leading-normal">
              These members will need to either delete, pause, or upgrade one or more of these
              projects before you're able to create a free project within this organization.
            </p>

            {orgLevelBilling && (
              <div>
                <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`} passHref>
                  <a target="_blank">
                    <Button type="primary">Upgrade plan</Button>
                  </a>
                </Link>
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}

export default FreeProjectLimitWarning
