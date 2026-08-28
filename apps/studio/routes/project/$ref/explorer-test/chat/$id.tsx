import { createFileRoute } from '@tanstack/react-router'

import { useSyncChatTabFromUrl } from '@/domain/explorer/useSyncTabFromUrl'

export const Route = createFileRoute('/project/$ref/explorer-test/chat/$id')({
  component: ExplorerTestChatRoute,
})

function ExplorerTestChatRoute() {
  const { id } = Route.useParams()
  useSyncChatTabFromUrl(id)

  return null
}
