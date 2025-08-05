import SignInPartner from 'components/interfaces/SignIn/SignInPartner'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import type { NextPageWithLayout } from 'types'

const SignInPartnerPage: NextPageWithLayout = () => {
  return <SignInPartner />
}

SignInPartnerPage.getLayout = (page) => (
  <SignInLayout heading="Signing you in..." subheading="">
    {page}
  </SignInLayout>
)

export default SignInPartnerPage
