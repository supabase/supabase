import { createFileRoute } from '@tanstack/react-router'

import ThirdPartyPage from '@/pages/project/[ref]/auth/third-party'

export const Route = createFileRoute('/project/$ref/auth/third-party')({
  component: AuthThirdPartyRoute,
  // The page body wraps itself in <AuthProvidersLayout>, which already
  // includes <AuthLayout>. Tell the auth.tsx shell to skip its own
  // AuthLayout wrap so we don't double-wrap (and double withAuth +
  // ProjectLayout).
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthThirdPartyRoute() {
  return <ThirdPartyPage dehydratedState={undefined} />
}
