import { createFileRoute } from '@tanstack/react-router'

import DatabasePhysicalBackups from '@/pages/project/[ref]/database/backups/pitr'

export const Route = createFileRoute('/project/$ref/database/backups/pitr')({
  component: DatabaseBackupsPitrRoute,
  staticData: {
    databaseLayoutTitle: 'Backups',
  },
})

function DatabaseBackupsPitrRoute() {
  return <DatabasePhysicalBackups dehydratedState={undefined} />
}
