import SignInMfaForm from 'components/interfaces/SignIn/SignInMfaForm'
import { SignInLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const SignInMfaPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-5">
      <SignInMfaForm />
    </div>
  )
}

SignInMfaPage.getLayout = (page) => (
  <SignInLayout
    heading="Two-factor authentication"
    subheading="Enter the authentication code from your two-factor authentication (TOTP) app"
    logoLinkToMarketingSite={true}
  >
    {page}
  </SignInLayout>
)

export default SignInMfaPage
