import { createFileRoute } from '@tanstack/react-router'

import TriggersDataPage from '@/pages/project/[ref]/database/triggers/data'

export const Route = createFileRoute('/project/$ref/database/triggers/data')({
  component: TriggersDataRoute,
})

function TriggersDataRoute() {
  return <TriggersDataPage dehydratedState={undefined} />
}
