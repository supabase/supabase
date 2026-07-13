import { createFileRoute } from '@tanstack/react-router'

import DatabaseEnumeratedTypes from '@/pages/project/[ref]/database/types'

export const Route = createFileRoute('/project/$ref/database/types')({
  component: DatabaseTypesRoute,
  staticData: {
    databaseLayoutTitle: 'Enumerated Types',
  },
})

function DatabaseTypesRoute() {
  return <DatabaseEnumeratedTypes dehydratedState={undefined} />
}
