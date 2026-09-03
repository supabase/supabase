import { createFileRoute } from '@tanstack/react-router'

import PgUpgradeLogsPage from '@/pages/project/[ref]/logs/pg-upgrade-logs'

export const Route = createFileRoute('/project/$ref/logs/pg-upgrade-logs')({
  component: PgUpgradeLogsRoute,
  staticData: { logsLayoutTitle: 'Postgres Version Upgrade' },
})

function PgUpgradeLogsRoute() {
  return <PgUpgradeLogsPage dehydratedState={undefined} />
}
