import { createFileRoute } from '@tanstack/react-router'

import EditorNewPage from '@/pages/project/[ref]/editor/new'

export const Route = createFileRoute('/project/$ref/editor/new')({
  component: TableEditorNewRoute,
})

function TableEditorNewRoute() {
  return <EditorNewPage dehydratedState={undefined} />
}
