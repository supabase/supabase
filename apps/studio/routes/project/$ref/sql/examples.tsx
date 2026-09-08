import { createFileRoute } from '@tanstack/react-router'

import SqlExamples from '@/pages/project/[ref]/sql/examples'

export const Route = createFileRoute('/project/$ref/sql/examples')({
  component: SqlExamplesRoute,
})

function SqlExamplesRoute() {
  return <SqlExamples dehydratedState={undefined} />
}
