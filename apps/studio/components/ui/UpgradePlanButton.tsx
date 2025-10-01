import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'

interface UpgradePlanButtonProps {
  source?: string
  type?: 'default' | 'primary'
  plan: 'Pro' | 'Team' | 'Enterprise'
}

export const UpgradePlanButton = ({
  source,
  type = 'default',
  plan,
  children,
}: PropsWithChildren<UpgradePlanButtonProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug ?? '_'

  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const subject = `Enquiry to upgrade to ${plan} plan for organization`
  const message = `Could I have some help to upgrade my organization to the ${plan} plan?\n\nName: ${organization?.name}\nSlug: ${organization?.slug}`

  const href = billingAll
    ? `/org/${slug}/billing?panel=subscriptionPlan${!!source ? `&source=${source}` : ''}`
    : `/support/new?slug=${slug}&projectRef=no-project&category=Plan_upgrade&subject=${subject}&message=${encodeURIComponent(message)}`

  return (
    <Button asChild type={type}>
      <Link href={href}>
        {billingAll ? children || `Upgrade to ${plan}` : 'Contact support to upgrade plan'}
      </Link>
    </Button>
  )
}
