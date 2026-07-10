import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AuthenticationLayout } from '@/components/layouts/AuthenticationLayout'

export const Route = createFileRoute('/_auth')({
  component: AuthShell,
})

function AuthShell() {
  return (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  )
}
