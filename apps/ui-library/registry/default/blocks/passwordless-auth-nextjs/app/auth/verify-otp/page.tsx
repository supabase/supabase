import { OTPVerifyForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/otp-verify-form'
import { Suspense } from 'react'

function OTPVerifyContent() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <OTPVerifyForm />
      </div>
    </div>
  )
}

export default function OTPVerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPVerifyContent />
    </Suspense>
  )
}
