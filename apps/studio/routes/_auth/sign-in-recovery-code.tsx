import { createFileRoute } from '@tanstack/react-router'

import { VerificationInterstitialLogo } from '@/components/interfaces/Account/VerificationInterstitialLogo'
import { SignInRecoveryCodeForm } from '@/components/interfaces/SignIn/SignInRecoveryCodeForm'
import { InterstitialLayout } from '@/components/layouts/InterstitialLayout'

export const Route = createFileRoute('/_auth/sign-in-recovery-code')({
  component: SignInRecoveryCodePage,
})

function SignInRecoveryCodePage() {
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
