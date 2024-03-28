import { useParams } from 'common'
import { useRouter } from 'next/router'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import dayjs from 'dayjs'
import { useSelectedProject } from 'hooks'

/**
 * Shown on projects in organization which are above their qouta
 */
export const RestrictrionBanner = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const project = useSelectedProject()

  const { data } = useOrganizationsQuery()

  const currentOrg = data?.find((org) => org.id === project?.organization_id)

  if (!currentOrg?.restriction_status) {
    return null
  }
  currentOrg
  return (
    <div
      className="flex items-center justify-center gap-x-4 bg-surface-100 py-3 transition text-foreground box-border border-b border-default"
      style={{ height: '44px' }}
    >
      <p className="text-sm">
        <a href={`/org/${currentOrg.slug}/billing`}>
          {' '}
          {currentOrg.restriction_status === 'grace_period' &&
            `Your organization has exceeded its quota. You are given a grace period until ${dayjs(currentOrg.restriction_data['grace_period_end']).format('DD MMM, YYYY')}`}
          {currentOrg.restriction_status === 'grace_period_over' &&
            `Your grace period is over and your project will not be able to serve requests when you used up your quota.`}
          {currentOrg.restriction_status === 'restricted' &&
            'Your organization has used up its quota. Your project is unable to serve any requests.'}
        </a>
      </p>
    </div>
  )
}
