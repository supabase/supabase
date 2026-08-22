import Link from 'next/link'
import { useState } from 'react'
import { Button, cn } from 'ui'

import { SignInWithExternalProvider } from '@/components/interfaces/SignIn/SignInWithExternalProvider'
import { SignUpForm } from '@/components/interfaces/SignIn/SignUpForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import { useInboundBranding } from '@/hooks/misc/useInboundBranding'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'
import type { NextPageWithLayout } from '@/types'

const SignUpPage: NextPageWithLayout = () => {
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const { dashboardAuthSignUp: signUpEnabled } = useIsFeatureEnabled(['dashboard_auth:sign_up'])

  const { focusProvider } = useInboundBranding('sign-up')
  const signUpProviders = useEnabledIdentityProviders().filter((provider) => provider.showOnSignUp)

  if (!signUpEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  // The sign-up options we offer besides a focused provider: other external providers and the email
  // form. Rendered both on the full screen and when the user expands "other options" from the
  // focused screen. The "or" pill's background matches the surface behind it: the page
  // (`bg-studio`) on the full screen, or the interstitial card (`bg-surface-100`) when revealed.
  const renderAuthOptions = (
    providers: ExternalIdentityProviderConfig[],
    dividerBgClass = 'bg-studio'
  ) => (
    <>
      {providers.map((provider) => (
        <SignInWithExternalProvider key={provider.id} provider={provider} />
      ))}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-strong" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={cn('px-2 text-sm text-foreground', dividerBgClass)}>or</span>
        </div>
      </div>

      <SignUpForm />
    </>
  )

  // Inbound link focused us on a single provider — lead with that one (SignInLayout renders the
  // matching interstitial frame around it), but let the user reveal the rest of our options.
  if (focusProvider) {
    const otherProviders = signUpProviders.filter((provider) => provider.id !== focusProvider.id)

    return (
      <div className="flex flex-col gap-5">
        <SignInWithExternalProvider provider={focusProvider} />
        {showOtherOptions ? (
          renderAuthOptions(otherProviders, 'bg-surface-100')
        ) : (
          <Button
            block
            variant="text"
            size="large"
            className="-mt-2 text-foreground-light"
            onClick={() => setShowOtherOptions(true)}
          >
            Show other options
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-5">{renderAuthOptions(signUpProviders)}</div>

      <div className="my-8 self-center text-sm">
        <span className="text-foreground-light">Have an account?</span>{' '}
        <Link
          href="/sign-in"
          className="underline text-foreground hover:text-foreground-light transition"
        >
          Sign in
        </Link>
      </div>
    </>
  )
}

SignUpPage.getLayout = (page) => (
  <SignInLayout heading="Get started" subheading="Create a new account" inboundFlow="sign-up">
    {page}
  </SignInLayout>
)

export default SignUpPage
