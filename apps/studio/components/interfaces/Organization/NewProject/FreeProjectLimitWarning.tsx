import Link from 'next/link'
import { Button, IconAlertCircle } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import InformationBox from 'components/ui/InformationBox'
import type { MemberWithFreeProjectLimit } from 'data/organizations/free-project-limit-check-query'

interface FreeProjectLimitWarningProps {
  membersExceededLimit: MemberWithFreeProjectLimit[]
  orgSlug: string
}

const FreeProjectLimitWarning = ({
  membersExceededLimit,
  orgSlug,
}: FreeProjectLimitWarningProps) => {
  return (
    <>
      <Admonition
        type={'default'}
        title={'The organization has members who have exceeded their free project limits'}
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

            <div>
              <Button asChild type="secondary">
                <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
              </Button>
            </div>
          </div>
        }
      ></Admonition>
      {/* <InformationBox
        icon={<IconAlertCircle className="text-foreground" size="large" strokeWidth={1.5} />}
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

            <div>
              <Button asChild type="primary">
                <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
              </Button>
            </div>
          </div>
        }
      /> */}
    </>
  )
}

export default FreeProjectLimitWarning
