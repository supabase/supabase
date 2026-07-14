import { createFileRoute } from '@tanstack/react-router'

import ForgotPasswordMfaPage from '@/pages/forgot-password-mfa'

export const Route = createFileRoute('/_auth/forgot-password-mfa')({
  component: ForgotPasswordMfa,
})

function ForgotPasswordMfa() {
  // The Next page inlines its own ForgotPasswordLayout; just render it.
  return <ForgotPasswordMfaPage dehydratedState={undefined} />
}
