import { VerificationInterstitialLogo } from '@/components/interfaces/Account/VerificationInterstitialLogo'
import { SignInRecoveryCodeForm } from '@/components/interfaces/SignIn/SignInRecoveryCodeForm'
import { InterstitialLayout } from '@/components/layouts/InterstitialLayout'
import type { NextPageWithLayout } from '@/types'

const SignInRecoveryCodePage: NextPageWithLayout = () => {
  return (
    <InterstitialLayout
      logo={<VerificationInterstitialLogo />}
      title="Use a recovery code"
      description="Enter one of the recovery codes you saved when setting up MFA."
    >
      <SignInRecoveryCodeForm />
    </InterstitialLayout>
  )
}

export default SignInRecoveryCodePage
