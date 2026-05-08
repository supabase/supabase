import { createFileRoute } from '@tanstack/react-router'

import SqlQuickstarts from '@/pages/project/[ref]/sql/quickstarts'

export const Route = createFileRoute('/project/$ref/sql/quickstarts')({
  component: SQLQuickstartsRoute,
})

function SQLQuickstartsRoute() {
  return <SqlQuickstarts dehydratedState={undefined} />
}
