import { createFileRoute } from '@tanstack/react-router'

import DatabaseRoles from '@/pages/project/[ref]/database/roles'

export const Route = createFileRoute('/project/$ref/database/roles')({
  component: DatabaseRolesRoute,
  staticData: {
    databaseLayoutTitle: 'Roles',
  },
})

function DatabaseRolesRoute() {
  return <DatabaseRoles dehydratedState={undefined} />
}
