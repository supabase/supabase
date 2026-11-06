import { createFileRoute } from '@tanstack/react-router'

import DatabaseExtensions from '@/pages/project/[ref]/database/extensions'

export const Route = createFileRoute('/project/$ref/database/extensions')({
  component: DatabaseExtensionsRoute,
  staticData: {
    databaseLayoutTitle: 'Extensions',
  },
})

function DatabaseExtensionsRoute() {
  return <DatabaseExtensions dehydratedState={undefined} />
}
