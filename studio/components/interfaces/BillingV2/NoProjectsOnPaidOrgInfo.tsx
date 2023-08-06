import InformationBox from 'components/ui/InformationBox'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import Link from 'next/link'
import { FC } from 'react'
import { Organization } from 'types'
import { IconInfo } from 'ui'

interface Props {
  organization?: Organization
}

const NoProjectsOnPaidOrgInfo: FC<Props> = ({ organization }) => {
  const { data: allProjects } = useProjectsQuery({
    enabled: organization?.subscription_id != undefined,
  })
  const projectCount =
    allProjects?.filter((project) => project.organization_id === organization?.id).length ?? 0

  const { data: orgSubscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: organization?.subscription_id != undefined }
  )

  if (projectCount > 0 || orgSubscription?.plan === undefined || orgSubscription.plan.id === 'free')
    return null

  return (
    <InformationBox
      defaultVisibility={true}
      hideCollapse
      title={`Your organization is on the ${orgSubscription.plan.name} plan with no projects running`}
      icon={<IconInfo strokeWidth={2} />}
      description={
        <div>
          The monthly fees for the paid plan still apply. To cancel your subscription, head over to
          your{' '}
          <Link href={`/org/${organization?.slug}/billing`}>
            <a>
              <span className="text-sm text-green-900 transition hover:text-green-1000">
                organization billing settings
              </span>
              .
            </a>
          </Link>
        </div>
      }
    />
  )
}

export default NoProjectsOnPaidOrgInfo
