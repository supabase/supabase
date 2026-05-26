import { createFileRoute } from '@tanstack/react-router'

import { SignUpForm } from '@/registry/default/blocks/password-based-auth-tanstack/components/sign-up-form'

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
})

function SignUp() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}
