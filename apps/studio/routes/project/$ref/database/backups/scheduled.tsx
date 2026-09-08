import { createFileRoute } from '@tanstack/react-router'

import DatabaseScheduledBackups from '@/pages/project/[ref]/database/backups/scheduled'

export const Route = createFileRoute('/project/$ref/database/backups/scheduled')({
  component: DatabaseBackupsScheduledRoute,
  staticData: {
    databaseLayoutTitle: 'Backups',
  },
})

function DatabaseBackupsScheduledRoute() {
  return <DatabaseScheduledBackups dehydratedState={undefined} />
}
