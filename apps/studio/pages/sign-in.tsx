import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button, cn } from 'ui'

import { LastSignInWrapper } from '@/components/interfaces/SignIn/LastSignInWrapper'
import { SignInForm } from '@/components/interfaces/SignIn/SignInForm'
import { SignInWithCustom } from '@/components/interfaces/SignIn/SignInWithCustom'
import { SignInWithExternalProvider } from '@/components/interfaces/SignIn/SignInWithExternalProvider'
import { AuthenticationLayout } from '@/components/layouts/AuthenticationLayout'
import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import { useInboundBranding } from '@/hooks/misc/useInboundBranding'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import type { ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'
import type { NextPageWithLayout } from '@/types'

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [showOtherOptions, setShowOtherOptions] = useState(false)

  const {
    dashboardAuthSignInWithSso: signInWithSsoEnabled,
    dashboardAuthSignInWithEmail: signInWithEmailEnabled,
    dashboardAuthSignUp: signUpEnabled,
  } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_sso',
    'dashboard_auth:sign_in_with_email',
    'dashboard_auth:sign_up',
  ])

  const { dashboardAuthCustomProvider: customProvider } = useCustomContent([
    'dashboard_auth:custom_provider',
  ])
  const branding = useInboundBranding('sign-in')
  const signInProviders = useEnabledIdentityProviders().filter((provider) => provider.showOnSignIn)

  useEffect(() => {
    if (!IS_PLATFORM) {
      // on selfhosted instance just redirect to projects page
      router.replace('/project/default')
    }
  }, [router])

  // The "or" separator's pill sits on top of the divider line, so its background must match the
  // surface behind it: the page (`bg-studio`) on the full screen, or the interstitial card
  // (`bg-surface-100`) when revealed from the focused screen.
  const renderOrDivider = (bgClass: string) => (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-strong" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className={cn('px-2 text-sm text-foreground', bgClass)}>or</span>
      </div>
    </div>
  )

  // The sign-in options we offer besides a focused provider: other external providers, a custom
  // provider, SSO, and the email form. Rendered both on the full screen and when the user expands
  // "other options" from the focused screen.
  const renderAuthOptions = (
    providers: ExternalIdentityProviderConfig[],
    dividerBgClass = 'bg-studio'
  ) => {
    const showOrDivider =
      (providers.length > 0 || signInWithSsoEnabled || !!customProvider) && signInWithEmailEnabled

    return (
      <>
        {customProvider && <SignInWithCustom providerName={customProvider} />}
        {providers.map((provider) => (
          <SignInWithExternalProvider key={provider.id} provider={provider} />
        ))}
        {signInWithSsoEnabled && (
          <LastSignInWrapper type="sso">
            <Button
              asChild
              block
              size="large"
              type="outline"
              icon={<Lock width={18} height={18} className="text-foreground" />}
            >
              <Link href={{ pathname: '/sign-in-sso', query: router.query }}>
                Continue with SSO
              </Link>
            </Button>
          </LastSignInWrapper>
        )}
        {showOrDivider && renderOrDivider(dividerBgClass)}
        {signInWithEmailEnabled && <SignInForm />}
      </>
    )
  }

  // Inbound link focused us on a single provider — lead with that one (SignInLayout renders the
  // matching interstitial frame around it), but let the user reveal the rest of our options.
  if (branding.focusProvider) {
    const focusProvider = branding.focusProvider
    const otherProviders = signInProviders.filter((provider) => provider.id !== focusProvider.id)
    const hasOtherOptions =
      otherProviders.length > 0 ||
      signInWithSsoEnabled ||
      !!customProvider ||
      signInWithEmailEnabled

    return (
      <div className="flex flex-col gap-5">
        <SignInWithExternalProvider provider={focusProvider} label="Continue" />
        {hasOtherOptions &&
          (showOtherOptions ? (
            renderAuthOptions(otherProviders, 'bg-surface-100')
          ) : (
            <Button
              block
              type="text"
              size="large"
              className="-mt-2 text-foreground-light"
              onClick={() => setShowOtherOptions(true)}
            >
              Show other options
            </Button>
          ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-5">{renderAuthOptions(signInProviders)}</div>

      {signUpEnabled && (
        <div className="self-center my-8 text-sm">
          <div>
            <span className="text-foreground-light">Don’t have an account?</span>{' '}
            <Link
              href={{
                pathname: '/sign-up',
                query: router.query,
              }}
              className="underline transition text-foreground hover:text-foreground-light"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

SignInPage.getLayout = (page) => (
  <AuthenticationLayout>
    <SignInLayout
      heading="Welcome back"
      subheading="Sign in to your account"
      logoLinkToMarketingSite={true}
      inboundFlow="sign-in"
    >
      {page}
    </SignInLayout>
  </AuthenticationLayout>
)

export default SignInPage
