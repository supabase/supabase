import { createFileRoute } from '@tanstack/react-router'

import TableEditorPage from '@/pages/project/[ref]/editor/index'

export const Route = createFileRoute('/project/$ref/editor/')({
  component: TableEditorIndexRoute,
})

function TableEditorIndexRoute() {
  return <TableEditorPage dehydratedState={undefined} />
}
