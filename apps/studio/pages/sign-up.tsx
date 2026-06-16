import Link from 'next/link'

import { SignInWithExternalProvider } from '@/components/interfaces/SignIn/SignInWithExternalProvider'
import { SignUpForm } from '@/components/interfaces/SignIn/SignUpForm'
import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import { useInboundBranding } from '@/hooks/misc/useInboundBranding'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const SignUpPage: NextPageWithLayout = () => {
  const { dashboardAuthSignUp: signUpEnabled } = useIsFeatureEnabled(['dashboard_auth:sign_up'])
  const branding = useInboundBranding('sign-up')
  const signUpProviders = useEnabledIdentityProviders().filter((provider) => provider.showOnSignUp)
  const showOAuthProviders = signUpProviders.length > 0

  if (!signUpEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  // Inbound link focused us on a single provider — offer only that one (SignInLayout renders the
  // matching interstitial frame around it).
  if (branding.focusProvider) {
    return (
      <div className="flex flex-col gap-5">
        <SignInWithExternalProvider provider={branding.focusProvider} label="Continue" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {showOAuthProviders && (
          <>
            {signUpProviders.map((provider) => (
              <SignInWithExternalProvider key={provider.id} provider={provider} />
            ))}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-strong" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-studio px-2 text-sm text-foreground">or</span>
              </div>
            </div>
          </>
        )}

        <SignUpForm />
      </div>

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
