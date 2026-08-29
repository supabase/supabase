import { createFileRoute } from '@tanstack/react-router'

import { useSyncNotebookTabFromUrl } from '@/domain/explorer/useSyncTabFromUrl'

export const Route = createFileRoute('/project/$ref/explorer-test/notebook/$id')({
  component: ExplorerTestNotebookRoute,
})

function ExplorerTestNotebookRoute() {
  const { id } = Route.useParams()
  useSyncNotebookTabFromUrl(id)

  return null
}
