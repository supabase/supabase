import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'

export const PLAN_REQUEST_EMPTY_PLACEHOLDER =
  '<Specify which plan to upgrade to: Pro | Team | Enterprise>'

interface UpgradePlanButtonProps {
  source?: string
  type?: 'default' | 'primary'
  plan?: 'Pro' | 'Team' | 'Enterprise'
  href?: string // [Joshen] As an override if needed (Used in UpgradeToPro)
  disabled?: boolean
}

export const UpgradePlanButton = ({
  source,
  type = 'default',
  plan,
  href: propsHref,
  disabled,
  children,
}: PropsWithChildren<UpgradePlanButtonProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug ?? '_'

  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const subject = `Enquiry to upgrade ${!!plan ? `to ${plan} ` : ''}plan for organization`
  const message = `Name: ${organization?.name}\nSlug: ${organization?.slug}\nRequested plan: ${plan ?? PLAN_REQUEST_EMPTY_PLACEHOLDER}`

  const href = billingAll
    ? propsHref ??
      `/org/${slug}/billing?panel=subscriptionPlan${!!source ? `&source=${source}` : ''}`
    : `/support/new?slug=${slug}&projectRef=no-project&category=Plan_upgrade&subject=${subject}&message=${encodeURIComponent(message)}`

  return (
    <Button asChild type={type} disabled={disabled}>
      <Link href={href}>{children || `Upgrade to ${plan}`}</Link>
    </Button>
  )
}
