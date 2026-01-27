import { PasswordlessLoginForm } from '@/registry/default/blocks/passwordless-auth-nextjs/components/passwordless-login-form'

export default function PasswordlessLoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <PasswordlessLoginForm />
      </div>
    </div>
  )
}
