import dayjs from 'dayjs'
import Link from 'next/link'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { AlertTitle_Shadcn_, Alert_Shadcn_, Button, CriticalIcon, WarningIcon } from 'ui'

/**
 * Shown on projects in organization which are above their qouta
 */
export const RestrictionBanner = () => {
  const project = useSelectedProject()
  const { data } = useOrganizationsQuery()
  const currentOrg = data?.find((org) => org.id === project?.organization_id)

  if (!currentOrg?.restriction_status) return null

  return (
    <Alert_Shadcn_
      variant={currentOrg.restriction_status === 'restricted' ? 'destructive' : 'warning'}
      className="rounded-none border-l-0 border-r-0 h-[44px] p-0 flex items-center justify-center"
    >
      <AlertTitle_Shadcn_ className="flex items-center gap-x-4">
        {currentOrg.restriction_status === 'restricted' ? <CriticalIcon /> : <WarningIcon />}
        <span>
          {currentOrg.restriction_status === 'grace_period' &&
            `Your organization has exceeded its quota. You are given a grace period until ${dayjs(currentOrg.restriction_data['grace_period_end']).format('DD MMM, YYYY')}`}
          {currentOrg.restriction_status === 'grace_period_over' &&
            `Your grace period is over and your project will not be able to serve requests when you used up your quota.`}
          {currentOrg.restriction_status === 'restricted' &&
            'Your project is unable to serve any requests as your organization has used up its quota.'}
        </span>
        <Button asChild type="default">
          <Link href={`/org/${currentOrg.slug}/billing`}>More information</Link>
        </Button>
      </AlertTitle_Shadcn_>
    </Alert_Shadcn_>
  )
}
