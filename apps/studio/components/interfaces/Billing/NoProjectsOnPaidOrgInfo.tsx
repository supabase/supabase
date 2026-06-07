import Link from 'next/link'
import { Admonition } from 'ui-patterns'

import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const EXCLUDED_PLANS = ['free', 'platform', 'enterprise']

export const NoProjectsOnPaidOrgInfo = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const isEligible = organization != null && !EXCLUDED_PLANS.includes(organization.plan.id ?? '')

  const { data } = useOrgProjectsInfiniteQuery(
    { slug: organization?.slug },
    { enabled: isEligible }
  )
  const projectCount = data?.pages[0].pagination.count ?? 0

  if (!isEligible || projectCount > 0) return null

  return (
    <Admonition
      type="default"
      title={`Your organization is on the ${organization.plan.name} plan with no projects running`}
      description={
        <div className="max-w-full! prose text-sm">
          The monthly fees for the paid plan still apply. To cancel your subscription, head over to
          your{' '}
          <Link href={`/org/${organization?.slug}/billing`}>organization billing settings</Link>
        </div>
      }
    />
  )
}
