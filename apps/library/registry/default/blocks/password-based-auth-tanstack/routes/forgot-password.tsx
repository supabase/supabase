import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordForm } from '@/registry/default/blocks/password-based-auth-tanstack/components/forgot-password-form'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
