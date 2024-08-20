import { ExternalLink } from 'lucide-react'

import { Alert_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import PartnerIcon from './PartnerIcon'

interface PartnerManagedResourceProps {
  partner: 'vercel-marketplace' | 'aws-marketplace'
  resource: string
  ctaUrl?: string
}

export const PARTNER_TO_NAME = {
  'vercel-marketplace': 'Vercel Marketplace',
  'aws-marketplace': 'AWS Marketplace',
} as const

function PartnerManagedResource({ partner, resource, ctaUrl }: PartnerManagedResourceProps) {
  return (
    <Alert_Shadcn_ className="flex flex-col items-center gap-4">
      <PartnerIcon organization={{ managed_by: partner }} showTooltip={false} size="large" />

      <AlertTitle_Shadcn_ className="text-lg">
        {resource} are managed by {PARTNER_TO_NAME[partner]}.
      </AlertTitle_Shadcn_>

      {ctaUrl && (
        <Button asChild iconRight={<ExternalLink />}>
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            View {resource} on {PARTNER_TO_NAME[partner]}
          </a>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default PartnerManagedResource
