import { createFileRoute } from '@tanstack/react-router'

import NotebookPage from '@/pages/project/[ref]/explorer/notebook/[id]'

export const Route = createFileRoute('/project/$ref/explorer/notebook/$id')({
  component: ProjectExplorerNotebookRoute,
})

function ProjectExplorerNotebookRoute() {
  return <NotebookPage dehydratedState={undefined} />
}
