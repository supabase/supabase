import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { StripeAtlasApplicationForm } from './StripeAtlasApplicationForm'
import {
  InterstitialLayout,
  LogoPair,
  PartnerLogo,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { BASE_PATH } from '@/lib/constants'

function decodeBase64Param(base64encoded: string): Base64Data | null {
  try {
    const bytes = Uint8Array.fromBase64(base64encoded)
    const decoded = new TextDecoder().decode(bytes)
    return base64DataSchema.parse(JSON.parse(decoded))
  } catch {
    return null
  }
}

const base64DataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('success'),
    stripeAtlasToken: z.string(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
])
type Base64Data = z.infer<typeof base64DataSchema>

/**
 * Mockup only — the form is deliberately unwired: no prefill query, no submit mutation and no
 * actions, so the page can be shared for live design feedback before the perk goes live.
 */
export const StripeAtlasApplicationScreen = () => {
  const params = useParams()

  // give the router a chance to parse the query params
  const [hydrated, setHydrated] = useState<boolean>(false)
  useEffect(() => setHydrated(true), [])
  if (!hydrated) {
    return (
      <InterstitialLayout>
        <LoadingCard />
      </InterstitialLayout>
    )
  }

  const decoded = params.data ? decodeBase64Param(params.data) : null

  return (
    <InterstitialLayout
      logo={
        <LogoPair
          left={<PartnerLogo src={`${BASE_PATH}/img/icons/stripe-icon.svg`} alt="Stripe" />}
          right={<SupabaseLogo />}
        />
      }
      title="$500 Credit Code for Stripe Atlas Merchants"
      description="Confirm your details below. Once the application is confirmed, you will receive a credit code via email."
    >
      {decoded === null && (
        <CardContent className="border-none pb-12">
          <Admonition
            type="caution"
            title="Only Pre-Filled Applications supported"
            description={
              <p>
                We currently only support pre-filled applications for Stripe Atlas Perks.
                <br />
                Please head to the Stripe Atlas dashboard and use the "Pre-fill my application"
                button.
              </p>
            }
          />
        </CardContent>
      )}
      {decoded?.type === 'error' && (
        <CardContent className="border-none pb-12">
          <Admonition
            type="danger"
            title="We've encountered an error"
            description={<p>{decoded.message}</p>}
          />
        </CardContent>
      )}
      {decoded?.type === 'success' && (
        <CardContent className="border-none">
          <StripeAtlasApplicationForm stripeAtlasToken={decoded.stripeAtlasToken} />
        </CardContent>
      )}
    </InterstitialLayout>
  )
}

const LoadingCard = () => {
  return (
    <CardContent className="flex flex-col gap-4 border-none">
      <div className="grid grid-cols-2 gap-3">
        <ShimmeringLoader className="h-10 w-full py-0" />
        <ShimmeringLoader className="h-10 w-full py-0" />
      </div>
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
    </CardContent>
  )
}
