import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import PartnerIcon from '@/components/ui/PartnerIcon'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

export type StripeTokenStatus = 'connected' | 'attention' | 'unknown'

export const STRIPE_DASHBOARD_URL = 'https://dashboard.stripe.com'
export const STRIPE_PROJECTS_DOCS_URL = 'https://docs.stripe.com/projects'

interface StripePaymentConnectionProps {
  status?: StripeTokenStatus
  tokenLast4?: string | null
  tokenExpiresAt?: number | null
}

const formatStripeTokenExpiry = (expiresAt?: number | null) => {
  if (!expiresAt) return undefined
  return new Date(expiresAt * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function StripePaymentConnection({
  status = 'connected',
  tokenLast4,
  tokenExpiresAt,
}: StripePaymentConnectionProps) {
  const tokenExpiry = formatStripeTokenExpiry(tokenExpiresAt)
  const hasTokenSummary =
    tokenLast4 !== null && tokenLast4 !== undefined && tokenExpiry !== undefined

  if (status === 'attention') {
    return (
      <Admonition
        type="warning"
        title="Stripe payment connection needs attention"
        description="The payment token linked to this organisation may be invalid or expired. To keep billing active, review and update it in your Stripe Dashboard."
        actions={
          <Button asChild type="warning" iconRight={<ExternalLink size={14} />}>
            <a href={STRIPE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              Review in Stripe Dashboard
            </a>
          </Button>
        }
      />
    )
  }

  if (status === 'unknown') {
    return (
      <Admonition
        type="default"
        title="Stripe payment setup in progress"
        description="Your Stripe payment connection is being configured. Check back shortly."
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-y-3 py-4 text-center">
      <PartnerIcon
        organization={{ managed_by: MANAGED_BY.STRIPE_PROJECTS }}
        showTooltip={false}
        size="large"
      />
      <div className="space-y-1">
        <p className="text-sm text-foreground">Payment managed through Stripe</p>
        <p className="text-sm text-foreground-light max-w-sm text-balance">
          Billing for this organisation is handled via a connected Stripe payment token.
        </p>
        {hasTokenSummary && (
          <p className="text-xs text-foreground-light">
            Token ending in {tokenLast4} expires {tokenExpiry}.
          </p>
        )}
      </div>
      <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
        <a
          href={`${STRIPE_PROJECTS_DOCS_URL}#manage-billing`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Manage via Stripe CLI
        </a>
      </Button>
    </div>
  )
}
