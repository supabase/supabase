import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useFlag, useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import { ButtonTooltip } from './ButtonTooltip'
import { RequestUpgradeToBillingOwners } from './RequestUpgradeToBillingOwners'

export const PLAN_REQUEST_EMPTY_PLACEHOLDER =
  '<Specify which plan to upgrade to: Pro | Team | Enterprise>'

interface UpgradePlanButtonProps {
  /** Stick to camel case for consistency */
  source: string
  type?: 'default' | 'primary'
  plan?: 'Pro' | 'Team' | 'Enterprise'
  addon?: 'pitr' | 'customDomain' | 'spendCap' | 'computeSize'
  /** Used in the default message template for request upgrade dialog, e.g: "Upgrade to ..." */
  featureProposition?: string
  disabled?: boolean
}

/**
 * If `billingAll` is enabled, links to upgrade paths (e.g organization settings, addons).
 *
 * Otherwise, links to support form instead
 */
export const UpgradePlanButton = ({
  source,
  type = 'primary',
  plan = 'Pro',
  addon,
  featureProposition,
  disabled,
  children,
}: PropsWithChildren<UpgradePlanButtonProps>) => {
  const { ref } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan?.id === 'free'
  const slug = organization?.slug ?? '_'

  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const { can: canUpdateSubscription } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const subject = `Enquiry to upgrade ${!!plan ? `to ${plan} ` : ''}plan for organization`
  const message = `Name: ${organization?.name}\nSlug: ${slug}\nRequested plan: ${plan ?? PLAN_REQUEST_EMPTY_PLACEHOLDER}`

  const href = billingAll
    ? isFreePlan
      ? `/org/${slug ?? '_'}/billing?panel=subscriptionPlan&source=${source}`
      : addon === 'spendCap'
        ? `/org/${slug ?? '_'}/billing?panel=costControl&source=${source}`
        : `/project/${ref ?? '_'}/settings/addons?panel=${addon}&source=${source}`
    : '/'

  const linkChildren = children || (!!addon ? 'Enable add-on' : `Upgrade to ${plan}`)
  const link = billingAll ? (
    <Link href={href}>{linkChildren}</Link>
  ) : (
    <SupportLink queryParams={{ orgSlug: slug, category: 'Plan_upgrade', subject, message }}>
      {linkChildren}
    </SupportLink>
  )

  if (!canUpdateSubscription) {
    return (
      <RequestUpgradeToBillingOwners
        plan={plan}
        addon={addon}
        featureProposition={featureProposition}
      >
        {children}
      </RequestUpgradeToBillingOwners>
    )
  }

  if (projectUpdateDisabled) {
    return (
      <ButtonTooltip
        disabled
        type="primary"
        tooltip={{
          content: {
            side: 'bottom',
            text: 'Plan changes are currently disabled, our engineers are working on a fix',
          },
        }}
      >
        {linkChildren}
      </ButtonTooltip>
    )
  }

  return (
    <Button asChild type={type} disabled={disabled}>
      {link}
    </Button>
  )
}
