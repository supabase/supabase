import { createFileRoute } from '@tanstack/react-router'

import DatabaseTriggersIndexPage from '@/pages/project/[ref]/database/triggers/index'

export const Route = createFileRoute('/project/$ref/database/triggers/')({
  component: DatabaseTriggersIndexRoute,
})

function DatabaseTriggersIndexRoute() {
  return <DatabaseTriggersIndexPage dehydratedState={undefined} />
}
