import { createFileRoute } from '@tanstack/react-router'

import { ResetPasswordForm } from '@/components/interfaces/SignIn/ResetPasswordForm'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import { withAuth } from '@/hooks/misc/withAuth'

export const Route = createFileRoute('/_auth/reset-password')({
  component: ResetPassword,
})

function ResetPassword() {
  return (
    <ForgotPasswordLayout
      heading="Change your password"
      subheading="Welcome back! Choose a new strong password and save it to proceed"
    >
      <ResetPasswordPageWithAuth />
    </ForgotPasswordLayout>
  )
}

function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <ResetPasswordForm />
    </div>
  )
}

const ResetPasswordPageWithAuth = withAuth(ResetPasswordPage)
