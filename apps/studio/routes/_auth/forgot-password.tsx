import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import ForgotPasswordPage from '@/pages/forgot-password'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  return (
    <ForgotPasswordLayout
      heading="Forgot your password?"
      subheading="Enter your email and we'll send you a code to reset the password"
    >
      <ForgotPasswordPage dehydratedState={undefined} />
    </ForgotPasswordLayout>
  )
}
