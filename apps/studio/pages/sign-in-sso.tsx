import { SignInSSOForm } from '@/components/interfaces/SignIn/SignInSSOForm'
import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const SignInSSOPage: NextPageWithLayout = () => {
  const signInWithSSOEnabled = useIsFeatureEnabled('dashboard_auth:sign_in_with_sso')

  if (!signInWithSSOEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInSSOForm />
      </div>
      {/* [console fork] self-host: no "Interested in SSO?" marketing contact link */}
    </>
  )
}

SignInSSOPage.getLayout = (page) => (
  <SignInLayout
    heading="Welcome back"
    subheading="Sign in to your enterprise account"
    logoLinkToMarketingSite={true}
  >
    {page}
  </SignInLayout>
)

export default SignInSSOPage
