import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import ResetPasswordPage from '@/pages/reset-password'

export const Route = createFileRoute('/_auth/reset-password')({
  component: ResetPassword,
})

function ResetPassword() {
  // Next page default export is already wrapped in withAuth — session guard runs inline.
  return (
    <ForgotPasswordLayout
      heading="Change your password"
      subheading="Welcome back! Choose a new strong password and save it to proceed"
    >
      <ResetPasswordPage dehydratedState={undefined} />
    </ForgotPasswordLayout>
  )
}
