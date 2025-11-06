import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import Link from 'next/link'
import type { Organization } from 'types'
import { Admonition } from 'ui-patterns'

interface NoProjectsOnPaidOrgInfoProps {
  organization?: Organization
}

export const NoProjectsOnPaidOrgInfo = ({ organization }: NoProjectsOnPaidOrgInfoProps) => {
  const { data } = useOrgProjectsInfiniteQuery({ slug: organization?.slug })
  const projectCount = data?.pages[0].pagination.count ?? 0

  if (
    projectCount > 0 ||
    organization?.plan === undefined ||
    organization.plan.id === 'free' ||
    organization.plan.id === 'enterprise'
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
