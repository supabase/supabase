import { createFileRoute } from '@tanstack/react-router'

import { AuthenticationLayout } from '@/components/layouts/AuthenticationLayout'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import SignInPage from '@/pages/sign-in'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignIn,
})

function SignIn() {
  return (
    <AuthenticationLayout>
      <SignInLayout
        heading="Welcome back"
        subheading="Sign in to your account"
        logoLinkToMarketingSite={true}
        inboundFlow="sign-in"
      >
        <SignInPage dehydratedState={undefined} />
      </SignInLayout>
    </AuthenticationLayout>
  )
}
