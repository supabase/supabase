import { OTPVerifyForm } from '@/registry/default/blocks/passwordless-auth-tanstack/components/otp-verify-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/verify-otp')({
  component: VerifyOTPPage,
  validateSearch: (search: Record<string, unknown>): { email?: string } => {
    return {
      email: (search.email as string) || undefined,
    }
  },
})

function VerifyOTPPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <OTPVerifyForm />
      </div>
    </div>
  )
}
