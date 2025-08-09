import { ExternalLink } from 'lucide-react'

import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useAwsRedirectQuery } from 'data/integrations/aws-redirect-query'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import PartnerIcon from './PartnerIcon'
import { BILLING_MANAGED_BY, BillingManagedBy } from 'lib/constants'

interface PartnerManagedResourceProps {
  partner: BillingManagedBy
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
  [BILLING_MANAGED_BY.VERCEL_MARKETPLACE]: 'Vercel Marketplace',
  [BILLING_MANAGED_BY.AWS_MARKETPLACE]: 'AWS Marketplace',
  [BILLING_MANAGED_BY.SUPABASE]: 'Supabase',
} as const

function PartnerManagedResource({ partner, resource, cta }: PartnerManagedResourceProps) {
  if (partner === BILLING_MANAGED_BY.SUPABASE) return null

  const ctaEnabled = cta !== undefined

  // Use appropriate redirect query based on partner
  const vercelQuery = useVercelRedirectQuery(
    {
      installationId: cta?.installationId,
    },
    {
      enabled: ctaEnabled && partner === BILLING_MANAGED_BY.VERCEL_MARKETPLACE,
    }
  )

  const awsQuery = useAwsRedirectQuery(
    {
      organizationSlug: cta?.organizationSlug,
    },
    {
      enabled: ctaEnabled && partner === BILLING_MANAGED_BY.AWS_MARKETPLACE,
    }
  )

  const { data, isLoading, isError } =
    partner === BILLING_MANAGED_BY.VERCEL_MARKETPLACE ? vercelQuery : awsQuery

  const ctaUrl = (data?.url ?? '') + (cta?.path ?? '')

  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-y-2 border-0 rounded-none">
      <PartnerIcon organization={{ managed_by: partner }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-sm">
        {resource} are managed by {PARTNER_TO_NAME[partner]}.
      </AlertTitle_Shadcn_>

      {ctaEnabled && (
        <Button asChild type="default" iconRight={<ExternalLink />} disabled={isLoading || isError}>
          <a href={cta.overrideUrl ?? ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta.message || `View ${resource} on ${PARTNER_TO_NAME[partner]}`}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
