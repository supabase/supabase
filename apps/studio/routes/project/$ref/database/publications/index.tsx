import { createFileRoute } from '@tanstack/react-router'

import DatabasePublications from '@/pages/project/[ref]/database/publications/index'

export const Route = createFileRoute('/project/$ref/database/publications/')({
  component: DatabasePublicationsIndexRoute,
  staticData: {
    databaseLayoutTitle: 'Publications',
  },
})

function DatabasePublicationsIndexRoute() {
  return <DatabasePublications dehydratedState={undefined} />
}
