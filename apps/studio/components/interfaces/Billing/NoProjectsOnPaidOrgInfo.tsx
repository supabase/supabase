import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import type { Organization } from 'types'
import { Admonition } from 'ui-patterns'
import { Markdown } from '../Markdown'

interface NoProjectsOnPaidOrgInfoProps {
  organization?: Organization
}

export const NoProjectsOnPaidOrgInfo = ({ organization }: NoProjectsOnPaidOrgInfoProps) => {
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
    <Admonition
      type="default"
      title={`Your organization is on the ${orgSubscription.plan.name} plan with no projects running`}
      description={
        <Markdown
          className="!max-w-full"
          content={`The monthly fees for the paid plan still apply. To cancel your subscription, head over to
          your [organization billing settings](/dashboard/org/${organization?.slug}/billing).`}
        />
      }
    />
  )
}
