import { createFileRoute } from '@tanstack/react-router'

import { UpdatePasswordForm } from '@/registry/default/blocks/password-based-auth-tanstack/components/update-password-form'

export const Route = createFileRoute('/update-password')({
  component: UpdatePassword,
})

function UpdatePassword() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
