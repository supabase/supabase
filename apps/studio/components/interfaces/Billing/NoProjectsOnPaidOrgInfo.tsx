import { Info } from 'lucide-react'
import Link from 'next/link'

import InformationBox from 'components/ui/InformationBox'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import type { Organization } from 'types'

interface NoProjectsOnPaidOrgInfoProps {
  organization?: Organization
}

const NoProjectsOnPaidOrgInfo = ({ organization }: NoProjectsOnPaidOrgInfoProps) => {
  const { data: allProjects } = useProjectsQuery({})
  const projectCount =
    allProjects?.filter((project) => project.organization_id === organization?.id).length ?? 0

  const { data: orgSubscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  if (
    projectCount > 0 ||
    orgSubscription?.plan === undefined ||
    orgSubscription.plan.id === 'free' ||
    orgSubscription.plan.id === 'enterprise'
  )
    return null

  return (
    <InformationBox
      defaultVisibility={true}
      hideCollapse
      title={`Your organization is on the ${orgSubscription.plan.name} plan with no projects running`}
      icon={<Info strokeWidth={2} />}
      description={
        <div>
          The monthly fees for the paid plan still apply. To cancel your subscription, head over to
          your{' '}
          <Link
            href={`/org/${organization?.slug}/billing`}
            className="text-sm text-green-900 transition hover:text-green-1000"
          >
            organization billing settings .
          </Link>
        </div>
      }
    />
  )
}

export default NoProjectsOnPaidOrgInfo
