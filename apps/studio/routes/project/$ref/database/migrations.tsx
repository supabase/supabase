import { createFileRoute } from '@tanstack/react-router'

import MigrationsPage from '@/pages/project/[ref]/database/migrations'

export const Route = createFileRoute('/project/$ref/database/migrations')({
  component: DatabaseMigrationsRoute,
  staticData: {
    databaseLayoutTitle: 'Migrations',
  },
})

function DatabaseMigrationsRoute() {
  return <MigrationsPage dehydratedState={undefined} />
}
