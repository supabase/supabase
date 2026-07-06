import { createFileRoute } from '@tanstack/react-router'

import SchemasPage from '@/pages/project/[ref]/database/schemas'

export const Route = createFileRoute('/project/$ref/database/schemas')({
  component: SchemasRoute,
  staticData: {
    databaseLayoutTitle: 'Schema Visualizer',
  },
})

function SchemasRoute() {
  return <SchemasPage dehydratedState={undefined} />
}
