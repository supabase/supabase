import { createFileRoute } from '@tanstack/react-router'

import SQLEditorIndexPage from '@/pages/project/[ref]/sql/index'

export const Route = createFileRoute('/project/$ref/sql/')({
  component: SQLEditorIndexRoute,
})

function SQLEditorIndexRoute() {
  return <SQLEditorIndexPage dehydratedState={undefined} />
}
