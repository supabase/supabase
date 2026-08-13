import { createFileRoute } from '@tanstack/react-router'

import { ChatEditor } from '@/components/interfaces/Explorer/ChatEditor'

export const Route = createFileRoute('/project/$ref/explorer/chat/$id')({
  component: ProjectExplorerChatRoute,
})

function ProjectExplorerChatRoute() {
  return <ChatEditor />
}
