import { createFileRoute } from '@tanstack/react-router'

import DatabasePublications from '@/pages/project/[ref]/database/publications/[id]'

export const Route = createFileRoute('/project/$ref/database/publications/$id')({
  component: DatabasePublicationDetailRoute,
  staticData: {
    databaseLayoutTitle: 'Publications',
  },
})

function DatabasePublicationDetailRoute() {
  return <DatabasePublications dehydratedState={undefined} />
}
