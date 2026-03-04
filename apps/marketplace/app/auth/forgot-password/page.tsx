import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="heading-title">Forgot password?</h1>
          <p className="text-foreground-light">
            Type in your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
