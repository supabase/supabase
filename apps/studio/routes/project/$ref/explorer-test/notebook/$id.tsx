import { createFileRoute } from '@tanstack/react-router'

import { useSyncNotebookTabFromUrl } from '@/domain/explorer/useSyncTabFromUrl'
import { withProjectRef } from '@/domain/project/withProjectRef'

export const Route = createFileRoute('/project/$ref/explorer-test/notebook/$id')({
  component: ExplorerTestNotebookRoute,
})

const ExplorerTestNotebookRouteInner = ({ projectRef }: { projectRef: string }) => {
  const { id } = Route.useParams()
  useSyncNotebookTabFromUrl(id, projectRef)

  return null
}
const SyncNotebookTab = withProjectRef(ExplorerTestNotebookRouteInner, null)

function ExplorerTestNotebookRoute() {
  return <SyncNotebookTab />
}
