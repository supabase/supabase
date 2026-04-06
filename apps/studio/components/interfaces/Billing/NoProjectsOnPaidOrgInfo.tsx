import Link from 'next/link'
import { Admonition } from 'ui-patterns'

import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import type { Organization } from '@/types'

interface NoProjectsOnPaidOrgInfoProps {
  organization?: Organization
}

export const NoProjectsOnPaidOrgInfo = ({ organization }: NoProjectsOnPaidOrgInfoProps) => {
  const isPlatformOrg = organization?.plan?.id === 'platform'
  const { data } = useOrgProjectsInfiniteQuery(
    { slug: organization?.slug },
    { enabled: !isPlatformOrg }
  )
  const projectCount = data?.pages[0].pagination.count ?? 0

  if (
    projectCount > 0 ||
    organization?.plan === undefined ||
    organization.plan.id === 'free' ||
    organization.plan.id === 'enterprise' ||
    isPlatformOrg
  )
    return null

  return (
    <Admonition
      type="default"
      title={`Your organization is on the ${organization.plan.name} plan with no projects running`}
      description={
        <div className="!max-w-full prose text-sm">
          The monthly fees for the paid plan still apply. To cancel your subscription, head over to
          your{' '}
          <Link href={`/org/${organization?.slug}/billing`}>organization billing settings</Link>
        </div>
      }
    />
  )
}
