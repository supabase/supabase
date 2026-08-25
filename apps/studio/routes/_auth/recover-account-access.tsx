import { createFileRoute } from '@tanstack/react-router'

import { RecoverAccountWizard } from '@/components/interfaces/SignIn/RecoverAccountWizard'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'

export const Route = createFileRoute('/_auth/recover-account-access')({
  component: LostAccountAccess,
})

function LostAccountAccess() {
  return (
    <ForgotPasswordLayout heading="Recover your account">
      <RecoverAccountWizard />
    </ForgotPasswordLayout>
  )
}
