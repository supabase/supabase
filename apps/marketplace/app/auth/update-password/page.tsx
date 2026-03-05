import { UpdatePasswordForm } from '@/components/update-password-form'

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="heading-title">Update password</h1>
          <p className="text-foreground-light">Set a new password for your account</p>
        </div>
        <UpdatePasswordForm />
      </div>
    </main>
  )
}
