import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export type StripeTokenStatus = 'connected' | 'attention' | 'unknown'

const STRIPE_DASHBOARD_URL = 'https://dashboard.stripe.com'

function StripeIcon() {
  return (
    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width="24" height="24" fill="#533AFD" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.625 18.375L18.375 15.6711V5.625L5.625 8.36048V18.375Z"
          fill="white"
          transform="translate(12 12) scale(0.82) translate(-12 -12)"
        />
      </svg>
    </div>
  )
}

export function StripePaymentConnection({ status = 'connected' }: { status?: StripeTokenStatus }) {
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
        description="Your Stripe payment connection is being configured. No action needed — check back shortly."
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-y-3 py-4 text-center">
      <StripeIcon />
      <div className="space-y-1">
        <p className="text-sm text-foreground">Payment managed through Stripe</p>
        <p className="text-sm text-foreground-light max-w-sm">
          Billing for this organisation is handled via a connected Stripe payment token. To view or
          update your payment details, visit your Stripe Dashboard.
        </p>
      </div>
      <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
        <a href={STRIPE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
          Manage in Stripe Dashboard
        </a>
      </Button>
    </div>
  )
}
