import { createFileRoute } from '@tanstack/react-router'

import RestoreToNewProjectPage from '@/pages/project/[ref]/database/backups/restore-to-new-project'

export const Route = createFileRoute('/project/$ref/database/backups/restore-to-new-project')({
  component: DatabaseBackupsRestoreToNewProjectRoute,
  staticData: {
    databaseLayoutTitle: 'Backups',
  },
})

function DatabaseBackupsRestoreToNewProjectRoute() {
  return <RestoreToNewProjectPage dehydratedState={undefined} />
}
