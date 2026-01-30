import { PasswordlessLoginForm } from '@/registry/default/blocks/passwordless-auth-tanstack/components/passwordless-login-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/passwordless')({
  component: PasswordlessPage,
})

function PasswordlessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <PasswordlessLoginForm method="magic-link" />
      </div>
    </div>
  )
}
