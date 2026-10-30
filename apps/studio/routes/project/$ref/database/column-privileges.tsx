import { createFileRoute } from '@tanstack/react-router'

import PrivilegesPage from '@/pages/project/[ref]/database/column-privileges'

export const Route = createFileRoute('/project/$ref/database/column-privileges')({
  component: DatabaseColumnPrivilegesRoute,
  staticData: {
    databaseLayoutTitle: 'Column Privileges',
  },
})

function DatabaseColumnPrivilegesRoute() {
  return <PrivilegesPage dehydratedState={undefined} />
}
