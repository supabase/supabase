import { useQuery } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { parseStripeAtlasLink, type StripeAtlasLinkState } from './StripeAtlasApplication.utils'
import { StripeAtlasApplicationForm } from './StripeAtlasApplicationForm'
import {
  InterstitialLayout,
  LogoPair,
  PartnerLogo,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { stripeAtlasApplicationQueryOptions } from '@/data/partners/stripe-atlas-application-query'
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
  <InterstitialLayout
    logo={
      <LogoPair
        left={<PartnerLogo src={`${BASE_PATH}/img/icons/stripe-icon.svg`} alt="Stripe" />}
        right={<SupabaseLogo />}
      />
    }
    title={title}
    description={description}
  >
    {children}
  </InterstitialLayout>
)

const ContactSupportCard = ({ message }: { message: ReactNode }) => (
  <StripeAtlasInterstitial
    title="Supabase credits for Stripe Atlas Merchants"
    description={message}
  >
    <CardContent className="border-none pt-0">
      <Button block asChild size="medium" variant="default">
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          Contact support
        </a>
      </Button>
    </CardContent>
  </StripeAtlasInterstitial>
)

const LoadingCard = () => (
  <StripeAtlasInterstitial
    title={<ShimmeringLoader className="mx-auto h-7 w-48 max-w-full py-0" />}
    description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
  >
    <CardContent className="flex flex-col gap-4 border-none">
      <div className="grid grid-cols-2 gap-3">
        <ShimmeringLoader className="h-10 w-full py-0" />
        <ShimmeringLoader className="h-10 w-full py-0" />
      </div>
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
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
        <a href={`${BASE_PATH}/redeem`}>Redeem your code</a>
      </Button>
    </CardContent>
  </StripeAtlasInterstitial>
)

/**
 * Fetches the details Stripe holds for this merchant, then hands them to the form as prefill.
 * Split out so the form mounts once with complete `defaultValues`.
 */
const StripeAtlasApplication = ({
  stripeAtlasToken,
  onSuccess,
}: {
  stripeAtlasToken: string
  onSuccess: (email: string) => void
}) => {
  const {
    data: application,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery(stripeAtlasApplicationQueryOptions({ stripeAtlasToken }))

  if (isPending) return <LoadingCard />

  if (isError) {
    return (
      <StripeAtlasInterstitial
        title="Supabase credits for Stripe Atlas Merchants"
        description="Stripe Atlas merchants get Supabase credits as a partner perk."
      >
        <CardContent className="flex flex-col gap-4 border-none pt-0">
          <Admonition
            type="danger"
            title="Unable to load your Stripe Atlas details"
            description={error.message}
          />
          <Button block size="medium" loading={isRefetching} onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </StripeAtlasInterstitial>
    )
  }

  return (
    <StripeAtlasInterstitial
      title="Claim your Supabase credits"
      description="Confirm the details from your Stripe Atlas company and we'll email you a credit code."
    >
      <StripeAtlasApplicationForm
        stripeAtlasToken={stripeAtlasToken}
        application={application}
        onSuccess={onSuccess}
      />
    </StripeAtlasInterstitial>
  )
}

export const StripeAtlasApplicationScreen = () => {
  // The link payload is only readable in the browser, and never changes for the life of the page.
  const [linkState, setLinkState] = useState<StripeAtlasLinkState | undefined>(undefined)
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined)

  useEffect(() => {
    setLinkState(parseStripeAtlasLink(window.location.search))
  }, [])

  if (submittedEmail !== undefined) return <SuccessCard email={submittedEmail} />

  if (linkState === undefined) return <LoadingCard />

  if (linkState.type === 'invalid-link') {
    return (
      <ContactSupportCard
        message={
          <>
            <br />
            To apply for Supabase credits, we need your Stripe Atlas company details.
            <br />
            <br />
            Please head back to the Stripe Atlas dashboard and choose "Pre-fill my application".
          </>
        }
      />
    )
  }

  if (linkState.type === 'error') {
    return <ContactSupportCard message={linkState.message} />
  }

  return (
    <StripeAtlasApplication
      stripeAtlasToken={linkState.stripeAtlasToken}
      onSuccess={setSubmittedEmail}
    />
  )
}
