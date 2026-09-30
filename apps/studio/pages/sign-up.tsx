import Link from 'next/link'
import { useState } from 'react'
import { Button, cn } from 'ui'

import { SignInOptions } from '@/components/interfaces/SignIn/SignInOptions'
import { SignInWithExternalProvider } from '@/components/interfaces/SignIn/SignInWithExternalProvider'
import { SignUpForm } from '@/components/interfaces/SignIn/SignUpForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useEnabledIdentityProviders } from '@/hooks/misc/useEnabledIdentityProviders'
import { useInboundBranding } from '@/hooks/misc/useInboundBranding'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const SignUpPage: NextPageWithLayout = () => {
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { dashboardAuthSignUp: signUpEnabled } = useIsFeatureEnabled(['dashboard_auth:sign_up'])

  const { focusProvider } = useInboundBranding('sign-up')
  const signUpProviders = useEnabledIdentityProviders().filter((provider) => provider.showOnSignUp)

  if (!signUpEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  return (
    <>
      {focusProvider ? (
        <div className="flex flex-col gap-5">
          {!isSubmitted && <SignInWithExternalProvider provider={focusProvider} />}
          {showOtherOptions ? (
            <>
              {!isSubmitted && (
                <SignInOptions
                  providers={signUpProviders.filter((provider) => provider.id !== focusProvider.id)}
                  dividerBgClass="bg-surface-100"
                />
              )}
              <SignUpForm onSuccess={() => setIsSubmitted(true)} />
            </>
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
      ) : (
        <div className="flex flex-col gap-5">
          {!isSubmitted && <SignInOptions providers={signUpProviders} />}
          <SignUpForm onSuccess={() => setIsSubmitted(true)} />
        </div>
      )}

      <div className={cn('self-center text-center text-sm mb-8', isSubmitted ? 'mt-2' : 'mt-8')}>
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
