import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'ui'

import JoinOrganizationPage from '@/pages/join'

export const Route = createFileRoute('/join')({
  component: Join,
})

function Join() {
  return (
    <div
      className={cn(
        'flex h-full min-h-screen bg-studio',
        'w-full flex-col place-items-center',
        'items-center justify-center gap-8 px-5'
      )}
    >
      <JoinOrganizationPage dehydratedState={undefined} />
    </div>
  )
}
