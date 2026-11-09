import { createFileRoute } from '@tanstack/react-router'

import SignInRecoveryCodePage from '@/pages/sign-in-recovery-code'

export const Route = createFileRoute('/_auth/sign-in-recovery-code')({
  component: SignInRecoveryCode,
})

function SignInRecoveryCode() {
  // The page owns its interstitial layout.
  return <SignInRecoveryCodePage dehydratedState={undefined} />
}
