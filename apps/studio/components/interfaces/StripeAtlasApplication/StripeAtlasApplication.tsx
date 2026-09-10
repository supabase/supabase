import { MailCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button, CardContent } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { parseStripeAtlasLink, type StripeAtlasLinkState } from './StripeAtlasApplication.utils'
import { StripeAtlasApplicationForm } from './StripeAtlasApplicationForm'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { BASE_PATH } from '@/lib/constants'

const SUPPORT_URL = 'https://supabase.com/support'

const StripeAtlasInterstitial = ({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) => (
  <InterstitialLayout logo={<SupabaseLogo />} title={title} description={description}>
    {children}
  </InterstitialLayout>
)

const ContactSupportCard = ({ message }: { message: string }) => (
  <StripeAtlasInterstitial title="Supabase credits for Stripe Atlas" description={message}>
    <CardContent className="border-none pt-0">
      <Button block asChild size="medium" variant="default">
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          Contact support
        </a>
      </Button>
    </CardContent>
  </StripeAtlasInterstitial>
)

const SuccessCard = ({ email }: { email: string }) => (
  <StripeAtlasInterstitial
    title="Check your email"
    description={
      <>
        We sent your Supabase credit code to <span className="text-foreground">{email}</span>. It
        can take a minute to arrive — check your spam folder if you don't see it.
      </>
    }
  >
    <CardContent className="flex flex-col gap-4 border-none pt-0">
      <div className="flex justify-center">
        <MailCheck className="size-6 text-foreground-lighter" strokeWidth={1.5} />
      </div>
      <p className="text-center text-xs text-foreground-lighter text-balance">
        Redeem the code against an organization to apply the credits.
      </p>
      <Button block asChild size="medium">
        <a href={`${BASE_PATH}/redeem`}>Go to redemption</a>
      </Button>
    </CardContent>
  </StripeAtlasInterstitial>
)

export const StripeAtlasApplicationScreen = () => {
  // The link params are only readable in the browser, and never change for the life of the page.
  const [linkState, setLinkState] = useState<StripeAtlasLinkState | undefined>(undefined)
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined)

  useEffect(() => {
    setLinkState(parseStripeAtlasLink(window.location.search))
  }, [])

  if (submittedEmail !== undefined) return <SuccessCard email={submittedEmail} />

  if (linkState === undefined) {
    return (
      <StripeAtlasInterstitial
        title={<ShimmeringLoader className="mx-auto h-7 w-48 max-w-full py-0" />}
        description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
      >
        <CardContent className="flex flex-col gap-4 border-none">
          <ShimmeringLoader className="h-10 w-full py-0" />
          <ShimmeringLoader className="h-10 w-full py-0" />
          <ShimmeringLoader className="h-10 w-full py-0" />
        </CardContent>
      </StripeAtlasInterstitial>
    )
  }

  if (linkState.status === 'application-error') {
    return <ContactSupportCard message={linkState.message} />
  }

  if (linkState.status === 'invalid-link') {
    return (
      <ContactSupportCard message="This link is invalid or has expired. Restart from your Stripe Atlas dashboard, or contact support if the problem persists." />
    )
  }

  return (
    <StripeAtlasInterstitial
      title="Claim your Supabase credits"
      description="Confirm your details and we'll email you a credit code."
    >
      <StripeAtlasApplicationForm data={linkState.data} onSuccess={setSubmittedEmail} />
    </StripeAtlasInterstitial>
  )
}
