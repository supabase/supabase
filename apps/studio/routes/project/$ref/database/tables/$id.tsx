import { createFileRoute } from '@tanstack/react-router'

import DatabaseTables from '@/pages/project/[ref]/database/tables/[id]'

export const Route = createFileRoute('/project/$ref/database/tables/$id')({
  component: DatabaseTableDetailRoute,
  staticData: {
    databaseLayoutTitle: 'Tables',
  },
})

function DatabaseTableDetailRoute() {
  return <DatabaseTables dehydratedState={undefined} />
}
