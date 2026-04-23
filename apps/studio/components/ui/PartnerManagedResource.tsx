import { ExternalLink } from 'lucide-react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'

import PartnerIcon from './PartnerIcon'
import { useAwsRedirectQuery } from '@/data/integrations/aws-redirect-query'
import { useVercelRedirectQuery } from '@/data/integrations/vercel-redirect-query'
import { MANAGED_BY, ManagedBy } from '@/lib/constants/infrastructure'

interface PartnerManagedResourceProps {
  managedBy: ManagedBy
  resource: string
  cta?: {
    installationId?: string
    organizationSlug?: string
    overrideUrl?: string
    path?: string
    message?: string
  }
}

export const PARTNER_TO_NAME = {
  [MANAGED_BY.VERCEL_MARKETPLACE]: 'Vercel Marketplace',
  [MANAGED_BY.AWS_MARKETPLACE]: 'AWS Marketplace',
  [MANAGED_BY.STRIPE_PROJECTS]: 'Stripe Projects',
  [MANAGED_BY.SUPABASE]: 'Supabase',
} as const

function PartnerManagedResource({ managedBy, resource, cta }: PartnerManagedResourceProps) {
  const ctaEnabled = cta !== undefined
  const supportsRedirectCta =
    managedBy === MANAGED_BY.VERCEL_MARKETPLACE || managedBy === MANAGED_BY.AWS_MARKETPLACE

  // Use appropriate redirect query based on partner
  const vercelQuery = useVercelRedirectQuery(
    {
      installationId: cta?.installationId,
    },
    {
      enabled: ctaEnabled && supportsRedirectCta && managedBy === MANAGED_BY.VERCEL_MARKETPLACE,
    }
  )

  const awsQuery = useAwsRedirectQuery(
    {
      organizationSlug: cta?.organizationSlug,
    },
    {
      enabled: ctaEnabled && supportsRedirectCta && managedBy === MANAGED_BY.AWS_MARKETPLACE,
    }
  )

  if (managedBy === MANAGED_BY.SUPABASE) return null

  const selectedRedirectQuery =
    managedBy === MANAGED_BY.VERCEL_MARKETPLACE
      ? vercelQuery
      : managedBy === MANAGED_BY.AWS_MARKETPLACE
        ? awsQuery
        : undefined

  const redirectBaseUrl = selectedRedirectQuery?.data?.url
  const ctaUrl =
    cta?.overrideUrl ?? (redirectBaseUrl ? `${redirectBaseUrl}${cta?.path ?? ''}` : undefined)
  const showCta = ctaEnabled && supportsRedirectCta && Boolean(ctaUrl)
  const partnerHeading =
    managedBy === MANAGED_BY.STRIPE_PROJECTS
      ? `${resource} are connected to Stripe.`
      : `${resource} are managed by ${PARTNER_TO_NAME[managedBy]}.`

  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-y-2 border-0 rounded-none">
      <PartnerIcon organization={{ managed_by: managedBy }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-sm">{partnerHeading}</AlertTitle_Shadcn_>

      {showCta && (
        <Button asChild type="default" iconRight={<ExternalLink />}>
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta?.message || `View ${resource} on ${PARTNER_TO_NAME[managedBy]}`}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
