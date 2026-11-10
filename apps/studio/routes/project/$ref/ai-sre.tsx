import { createFileRoute, Outlet } from '@tanstack/react-router'

import AiSreLayout from '@/components/layouts/AiSreLayout/AiSreLayout'

export const Route = createFileRoute('/project/$ref/ai-sre')({
  component: AiSreShell,
})

function AiSreShell() {
  return (
    <AiSreLayout>
      <Outlet />
    </AiSreLayout>
  )
}
