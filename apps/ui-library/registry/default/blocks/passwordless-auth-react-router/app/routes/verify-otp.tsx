import { OTPVerifyForm } from '@/registry/default/blocks/passwordless-auth-react-router/components/otp-verify-form'

export default function VerifyOTPPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <OTPVerifyForm />
      </div>
    </div>
  )
}
