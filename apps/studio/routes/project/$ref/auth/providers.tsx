import { createFileRoute } from '@tanstack/react-router'

import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import ProvidersPage from '@/pages/project/[ref]/auth/providers'

export const Route = createFileRoute('/project/$ref/auth/providers')({
  component: AuthProvidersRoute,
  // AuthProvidersLayout wraps in <AuthLayout> internally; the auth.tsx
  // shell skips its own AuthLayout wrap so we don't double-wrap (and
  // double withAuth + ProjectLayout).
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthProvidersRoute() {
  return (
    <AuthProvidersLayout>
      <ProvidersPage dehydratedState={undefined} />
    </AuthProvidersLayout>
  )
}
