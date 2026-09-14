import { createFileRoute } from '@tanstack/react-router'

import ChatPage from '@/pages/project/[ref]/explorer/chat/[id]'

export const Route = createFileRoute('/project/$ref/explorer/chat/$id')({
  component: ProjectExplorerChatRoute,
})

function ProjectExplorerChatRoute() {
  return <ChatPage dehydratedState={undefined} />
}
