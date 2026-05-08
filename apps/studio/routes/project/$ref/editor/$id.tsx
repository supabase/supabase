import { createFileRoute } from '@tanstack/react-router'

import TableEditorPage from '@/pages/project/[ref]/editor/[id]'

export const Route = createFileRoute('/project/$ref/editor/$id')({
  component: TableEditorDetailRoute,
})

function TableEditorDetailRoute() {
  return <TableEditorPage dehydratedState={undefined} />
}
