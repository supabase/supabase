import { createFileRoute } from '@tanstack/react-router'

import SqlEditor from '@/pages/project/[ref]/sql/[id]'

export const Route = createFileRoute('/project/$ref/sql/$id')({
  component: SQLEditorDetailRoute,
})

function SQLEditorDetailRoute() {
  return <SqlEditor dehydratedState={undefined} />
}
