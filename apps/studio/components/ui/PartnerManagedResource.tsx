import { ExternalLink } from 'lucide-react'

import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useAwsRedirectQuery } from 'data/integrations/aws-redirect-query'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import PartnerIcon from './PartnerIcon'
import { MANAGED_BY, ManagedBy } from 'lib/constants/infrastructure'

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
  [MANAGED_BY.SUPABASE]: 'Supabase',
} as const

function PartnerManagedResource({ managedBy, resource, cta }: PartnerManagedResourceProps) {
  const ctaEnabled = cta !== undefined

  // Use appropriate redirect query based on partner
  const vercelQuery = useVercelRedirectQuery(
    {
      installationId: cta?.installationId,
    },
    {
      enabled: ctaEnabled && managedBy === MANAGED_BY.VERCEL_MARKETPLACE,
    }
  )

  const awsQuery = useAwsRedirectQuery(
    {
      organizationSlug: cta?.organizationSlug,
    },
    {
      enabled: ctaEnabled && managedBy === MANAGED_BY.AWS_MARKETPLACE,
    }
  )

  if (managedBy === MANAGED_BY.SUPABASE) return null

  const { data, isLoading, isError } =
    managedBy === MANAGED_BY.VERCEL_MARKETPLACE ? vercelQuery : awsQuery

  const ctaUrl = (data?.url ?? '') + (cta?.path ?? '')

  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-y-2 border-0 rounded-none">
      <PartnerIcon organization={{ managed_by: managedBy }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-sm">
        {resource} are managed by {PARTNER_TO_NAME[managedBy]}.
      </AlertTitle_Shadcn_>

      {ctaEnabled && (
        <Button asChild type="default" iconRight={<ExternalLink />} disabled={isLoading || isError}>
          <a href={cta.overrideUrl ?? ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta.message || `View ${resource} on ${PARTNER_TO_NAME[managedBy]}`}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
