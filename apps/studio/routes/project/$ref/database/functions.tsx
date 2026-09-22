import { createFileRoute } from '@tanstack/react-router'

import DatabaseFunctionsPage from '@/pages/project/[ref]/database/functions'

export const Route = createFileRoute('/project/$ref/database/functions')({
  component: DatabaseFunctionsRoute,
  staticData: {
    databaseLayoutTitle: 'Functions',
  },
})

function DatabaseFunctionsRoute() {
  return <DatabaseFunctionsPage dehydratedState={undefined} />
}
