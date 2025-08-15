import { ExternalLink } from 'lucide-react'

import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import PartnerIcon from './PartnerIcon'
import { MANAGED_BY, ManagedBy } from 'lib/constants/infrastructure'

interface PartnerManagedResourceProps {
  partner: ManagedBy
  resource: string
  cta?: {
    installationId?: string
    path?: string
    message?: string
  }
}

export const PARTNER_TO_NAME = {
  [MANAGED_BY.VERCEL_MARKETPLACE]: 'Vercel Marketplace',
  [MANAGED_BY.AWS_MARKETPLACE]: 'AWS Marketplace',
  [MANAGED_BY.SUPABASE]: 'Supabase',
} as const

function PartnerManagedResource({ partner, resource, cta }: PartnerManagedResourceProps) {
  const isManagedBySupabase = partner === MANAGED_BY.SUPABASE
  const ctaEnabled = cta !== undefined

  const { data, isLoading, isError } = useVercelRedirectQuery(
    {
      installationId: cta?.installationId,
    },
    {
      enabled: ctaEnabled && !isManagedBySupabase,
    }
  )

  if (isManagedBySupabase) return null

  const ctaUrl = (data?.url ?? '') + (cta?.path ?? '')

  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-y-2 border-0 rounded-none">
      <PartnerIcon organization={{ managed_by: partner }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-sm">
        {resource} are managed by {PARTNER_TO_NAME[partner]}.
      </AlertTitle_Shadcn_>

      {ctaEnabled && (
        <Button asChild type="default" iconRight={<ExternalLink />} disabled={isLoading || isError}>
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta.message || `View ${resource} on ${PARTNER_TO_NAME[partner]}`}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
