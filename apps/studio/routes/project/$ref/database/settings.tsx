import { createFileRoute } from '@tanstack/react-router'

import DatabaseSettings from '@/pages/project/[ref]/database/settings'

export const Route = createFileRoute('/project/$ref/database/settings')({
  component: DatabaseSettingsRoute,
  staticData: {
    databaseLayoutTitle: 'Settings',
  },
})

function DatabaseSettingsRoute() {
  return <DatabaseSettings dehydratedState={undefined} />
}
