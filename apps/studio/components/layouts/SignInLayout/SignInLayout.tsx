import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken, useFlag } from 'common'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { tweets } from 'shared-data'
import { cn } from 'ui'

import {
  DestinationLogo,
  InterstitialLayout,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { IdentityProviderIcon } from '@/components/ui/ProviderIcon'
import { useInboundBranding } from '@/hooks/misc/useInboundBranding'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import { getProviderDisplay } from '@/lib/external-identity-providers'
import { auth, buildPathWithParams, getReturnToPath } from '@/lib/gotrue'

type Quote = {
  text: string
  url: string
  handle: string
  img_url: string
}

type SignInLayoutProps = {
  heading: string
  subheading: string
  showDisclaimer?: boolean
  logoLinkToMarketingSite?: boolean
  /**
   * When set, the layout can show a focused-provider interstitial or swap its default heading for
   * a destination-branded header (see {@link useInboundBranding}). The flow controls the verb
   * ("Sign in" vs "Sign up").
   */
  inboundFlow?: 'sign-in' | 'sign-up'
}

const TermsText = () => (
  <>
    By continuing, you agree to Supabase’s{' '}
    <InlineLink href="https://supabase.com/terms">Terms of Service</InlineLink> and{' '}
    <InlineLink href="https://supabase.com/privacy">Privacy Policy</InlineLink>, and to receive
    periodic emails with updates.
  </>
)

export const SignInLayout = ({
  heading,
  subheading,
  showDisclaimer = true,
  logoLinkToMarketingSite = false,
  inboundFlow,
  children,
}: PropsWithChildren<SignInLayoutProps>) => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()
  const ongoingIncident = useFlag('ongoingIncident')

  const { destination, focusProvider } = useInboundBranding(inboundFlow)

  // Addresses hydration issue with `resolvedTheme` as its undefined during SSR and the first (hydrating) client render
  const [mounted, setMounted] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)

  const verb = inboundFlow === 'sign-up' ? 'Sign up' : 'Sign in'

  const {
    dashboardAuthShowTestimonial: showTestimonial,
    brandingLargeLogo: largeLogo,
    dashboardAuthShowTos: showTos,
  } = useIsFeatureEnabled([
    'dashboard_auth:show_testimonial',
    'branding:large_logo',
    'dashboard_auth:show_tos',
  ])

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          // if there was a problem signing in via the url, don't redirect
          return
        }

        const token = await getAccessToken()

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            return
          }

          if (data) {
            // we're already where we need to be
            if (router.pathname === '/sign-in-mfa') {
              return
            }
            if (data.currentLevel !== data.nextLevel) {
              const redirectTo = buildPathWithParams('/sign-in-mfa')
              router.replace(redirectTo)
              return
            }
          }

          await queryClient.resetQueries()
          router.push(getReturnToPath())
        }
      })
      .catch(() => {}) // catch all errors thrown by auth methods
  }, [])

  useEffect(() => {
    setMounted(true)

    // Weighted random selection
    // Calculate total weight (default weight is fallbackWeight for tweets without weight specified)
    const fallbackWeight = 1
    const totalWeight = tweets.reduce((sum, tweet) => sum + (tweet.weight ?? fallbackWeight), 0)

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight

    // Find the selected tweet based on cumulative weights
    let accumulatedWeight = 0
    for (const tweet of tweets) {
      const weight = tweet.weight ?? fallbackWeight
      accumulatedWeight += weight
      if (random <= accumulatedWeight) {
        setQuote(tweet)
        break
      }
    }
  }, [])

  // Focused provider: render a dedicated single-provider interstitial (same card layout as the
  // external-identity flows). When we also know the destination the inbound link is returning the
  // user to, frame the screen around it.
  if (inboundFlow && focusProvider) {
    return (
      <InterstitialLayout
        logo={
          <LogoPair
            left={
              <DestinationLogo
                icon={
                  destination?.icon ?? (
                    <IdentityProviderIcon
                      display={getProviderDisplay(focusProvider.id)}
                      size={28}
                    />
                  )
                }
                name={destination?.displayName ?? focusProvider.displayName}
              />
            }
            right={<SupabaseLogo />}
          />
        }
        title={destination ? `Continue to ${destination.displayName}` : `${verb} to Supabase`}
        description={
          destination
            ? `${verb} to Supabase using your ${focusProvider.displayName} account`
            : `Use your ${focusProvider.displayName} account to continue`
        }
        footer={
          showDisclaimer && showTos ? (
            <p className="text-xs text-foreground-lighter">
              <TermsText />
            </p>
          ) : undefined
        }
      >
        <div className="px-6 pb-6">{children}</div>
      </InterstitialLayout>
    )
  }

  // Destination known but no focused provider: keep the regular screen but brand its heading.
  const brandedDestination = inboundFlow ? destination : undefined
  const brandedHeading = brandedDestination
    ? `${verb} to continue to ${brandedDestination.displayName}`
    : undefined

  return (
    <>
      <div className="relative flex flex-col bg-alternative min-h-screen">
        <div
          className={cn(
            'absolute top-0 w-full px-8 mx-auto sm:px-6 lg:px-8',
            ongoingIncident ? 'mt-14' : 'mt-6'
          )}
        >
          <nav className="relative flex items-center justify-between sm:h-10">
            <div className="flex items-center grow shrink-0 lg:grow-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <Link href={logoLinkToMarketingSite ? 'https://supabase.com' : '/organizations'}>
                  <img
                    src={
                      mounted && resolvedTheme?.includes('dark')
                        ? `${BASE_PATH}/img/supabase-dark.svg`
                        : `${BASE_PATH}/img/supabase-light.svg`
                    }
                    alt="Supabase Logo"
                    className={largeLogo ? 'h-[48px]' : 'h-[24px]'}
                  />
                </Link>
              </div>
            </div>

            <div className="items-center hidden space-x-3 md:ml-10 md:flex md:pr-4">
              <DocsButton abbrev={false} href={`${DOCS_URL}`} />
            </div>
          </nav>
        </div>

        <div className="flex flex-1 h-full">
          <main className="flex flex-col items-center flex-1 shrink-0 px-5 pt-16 pb-8 border-r shadow-lg bg-studio border-default">
            <div className="flex-1 flex flex-col justify-center w-[330px] sm:w-[384px]">
              {brandedDestination ? (
                <div className="mb-10 flex flex-col items-center gap-5 text-center">
                  <LogoPair
                    left={
                      <DestinationLogo
                        icon={brandedDestination.icon}
                        name={brandedDestination.displayName}
                      />
                    }
                    right={<SupabaseLogo />}
                  />
                  <h1 className="text-balance lg:text-2xl">{brandedHeading}</h1>
                </div>
              ) : (
                <div className="mb-10">
                  <h1 className="mt-8 mb-2 lg:text-3xl">{heading}</h1>
                  <h2 className="text-sm text-foreground-light">{subheading}</h2>
                </div>
              )}

              {children}
            </div>

            {showDisclaimer && showTos && (
              <div className="text-center text-balance">
                <p className="text-xs text-foreground-lighter sm:mx-auto sm:max-w-sm">
                  <TermsText />
                </p>
              </div>
            )}
          </main>

          <aside className="flex-col items-center justify-center flex-1 shrink hidden basis-1/4 xl:flex">
            {quote !== null && showTestimonial && (
              <div className="relative flex flex-col gap-6">
                <div className="absolute select-none -top-12 -left-11">
                  <span className="text-[160px] leading-none text-foreground-muted/30">{'“'}</span>
                </div>

                <blockquote className="z-10 max-w-lg text-3xl">{quote.text}</blockquote>

                <a
                  href={quote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  <img
                    src={`https://supabase.com${quote.img_url}`}
                    alt={quote.handle}
                    className="w-12 h-12 rounded-full"
                  />

                  <div className="flex flex-col">
                    <cite className="not-italic font-medium text-foreground-light whitespace-nowrap">
                      @{quote.handle}
                    </cite>
                  </div>
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
