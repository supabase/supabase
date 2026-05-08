import { createFileRoute } from '@tanstack/react-router'

import AuthPoliciesPage from '@/pages/project/[ref]/auth/policies'

export const Route = createFileRoute('/project/$ref/auth/policies')({
  component: AuthPoliciesRoute,
  staticData: {
    authLayoutTitle: 'Policies',
  },
})

function AuthPoliciesRoute() {
  return <AuthPoliciesPage dehydratedState={undefined} />
}
