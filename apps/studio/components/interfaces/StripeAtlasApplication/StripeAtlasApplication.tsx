import { CardContent } from 'ui'

import { StripeAtlasApplicationForm } from './StripeAtlasApplicationForm'
import {
  InterstitialLayout,
  LogoPair,
  PartnerLogo,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { BASE_PATH } from '@/lib/constants'

/**
 * Mockup only — the form is deliberately unwired: no prefill query, no submit mutation and no
 * actions, so the page can be shared for live design feedback before the perk goes live.
 */
export const StripeAtlasApplicationScreen = () => (
  <InterstitialLayout
    logo={
      <LogoPair
        left={<PartnerLogo src={`${BASE_PATH}/img/icons/stripe-icon.svg`} alt="Stripe" />}
        right={<SupabaseLogo />}
      />
    }
    title="Claim your Supabase credits"
    description="Confirm the details from your Stripe Atlas company and we'll email you a credit code."
  >
    <CardContent className="border-none">
      <StripeAtlasApplicationForm />
    </CardContent>
  </InterstitialLayout>
)
