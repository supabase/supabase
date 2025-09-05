import { PasswordLoginForm } from '@/registry/default/blocks/password-based-auth-nextjs/components/password-login-form'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <PasswordLoginForm />
      </div>
    </div>
  )
}
