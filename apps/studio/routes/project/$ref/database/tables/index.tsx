import { createFileRoute } from '@tanstack/react-router'

import DatabaseTables from '@/pages/project/[ref]/database/tables/index'

export const Route = createFileRoute('/project/$ref/database/tables/')({
  component: DatabaseTablesIndexRoute,
  staticData: {
    databaseLayoutTitle: 'Tables',
  },
})

function DatabaseTablesIndexRoute() {
  return <DatabaseTables dehydratedState={undefined} />
}
