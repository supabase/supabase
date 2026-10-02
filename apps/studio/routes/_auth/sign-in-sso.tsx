import { createFileRoute } from '@tanstack/react-router'

import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import SignInSSOPage from '@/pages/sign-in-sso'

export const Route = createFileRoute('/_auth/sign-in-sso')({
  component: SignInSSO,
})

function SignInSSO() {
  return (
    <SignInLayout
      heading="Welcome back"
      subheading="Sign in to your enterprise account"
      logoLinkToMarketingSite={true}
    >
      <SignInSSOPage dehydratedState={undefined} />
    </SignInLayout>
  )
}
