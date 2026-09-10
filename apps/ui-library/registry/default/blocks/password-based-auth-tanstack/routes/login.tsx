import { createFileRoute } from '@tanstack/react-router'

import { LoginForm } from '@/registry/default/blocks/password-based-auth-tanstack/components/login-form'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
