import { createFileRoute } from '@tanstack/react-router'

import TriggersSchemaPage from '@/pages/project/[ref]/database/triggers/event'

export const Route = createFileRoute('/project/$ref/database/triggers/event')({
  component: TriggersEventRoute,
})

function TriggersEventRoute() {
  return <TriggersSchemaPage dehydratedState={undefined} />
}
