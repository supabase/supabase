import { ExternalLink } from 'lucide-react'

import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import PartnerIcon from './PartnerIcon'

interface PartnerManagedResourceProps {
  partner: 'vercel-marketplace' | 'aws-marketplace'
  resource: string
  cta?: {
    installationId?: string
    path?: string
    message?: string
  }
}

export const PARTNER_TO_NAME = {
  'vercel-marketplace': 'Vercel Marketplace',
  'aws-marketplace': 'AWS Marketplace',
} as const

function PartnerManagedResource({ partner, resource, cta }: PartnerManagedResourceProps) {
  const ctaEnabled = cta !== undefined

  const { data, isLoading, isError } = useVercelRedirectQuery(
    {
      installationId: cta?.installationId,
    },
    {
      enabled: ctaEnabled,
    }
  )

  const ctaUrl = (data?.url ?? '') + (cta?.path ?? '')

  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-4">
      <PartnerIcon organization={{ managed_by: partner }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-lg">
        {resource} are managed by {PARTNER_TO_NAME[partner]}.
      </AlertTitle_Shadcn_>

      {ctaEnabled && (
        <Button asChild iconRight={<ExternalLink />} disabled={isLoading || isError}>
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta.message || `View ${resource} on ${PARTNER_TO_NAME[partner]}`}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
