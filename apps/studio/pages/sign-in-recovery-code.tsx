import { SignInMfaForm } from '@/components/interfaces/SignIn/SignInMfaForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import type { NextPageWithLayout } from '@/types'

const SignInRecoveryCodePage: NextPageWithLayout = () => {
  return (
    <SignInLayout
      heading="Recovery code authentication"
      subheading="Enter a recovery code"
      logoLinkToMarketingSite={true}
    >
      <div className="flex flex-col gap-5">
        <SignInMfaForm />
      </div>
    </SignInLayout>
  )
}

export default SignInRecoveryCodePage
