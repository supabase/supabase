import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import LostAccountAccessForm from '@/pages/lost-account-access'

export const Route = createFileRoute('/_auth/lost-account-access')({
  component: LostAccountAccess,
})

function LostAccountAccess() {
  return (
    <ForgotPasswordLayout heading="Recover your account">
      <LostAccountAccessForm dehydratedState={undefined} />
    </ForgotPasswordLayout>
  )
}
