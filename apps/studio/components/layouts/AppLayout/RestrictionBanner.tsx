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
        {currentOrg.restriction_status === 'grace_period' &&
          `Projects in this organization are over quota. You are given a grace period, and service restriction will kick in on ${dayjs(currentOrg.restriction_data['grace_period_end']).format('DD MMM YYYY')}`}
        {currentOrg.restriction_status === 'grace_period_over' &&
          `Projects in this organization are over quota. Your grace period is over and you will be restricted if you are above limit. Service restriction will kick in on ${dayjs(currentOrg.restriction_data['grace_period_end']).format('DD MMM YYYY')}`}
        {currentOrg.restriction_status === 'restricted' &&
          'Projects in this organization are over quota and restricted.'}
      </p>
    </div>
  )
}
