import { createFileRoute } from '@tanstack/react-router'

import PoliciesPage from '@/pages/project/[ref]/database/policies'

export const Route = createFileRoute('/project/$ref/database/policies')({
  component: DatabasePoliciesRoute,
  staticData: {
    databaseLayoutTitle: 'Policies',
  },
})

function DatabasePoliciesRoute() {
  return <PoliciesPage dehydratedState={undefined} />
}
