import { createFileRoute } from '@tanstack/react-router'

import IndexesPage from '@/pages/project/[ref]/database/indexes'

export const Route = createFileRoute('/project/$ref/database/indexes')({
  component: DatabaseIndexesRoute,
  staticData: {
    databaseLayoutTitle: 'Indexes',
  },
})

function DatabaseIndexesRoute() {
  return <IndexesPage dehydratedState={undefined} />
}
