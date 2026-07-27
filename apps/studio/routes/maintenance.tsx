import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'ui'

import MaintenancePage from '@/pages/maintenance'

export const Route = createFileRoute('/maintenance')({
  component: Maintenance,
})

function Maintenance() {
  return (
    <div
      className={cn(
        'flex h-full min-h-screen bg-studio',
        'w-full flex-col place-items-center',
        'items-center justify-center gap-8 px-5'
      )}
    >
      <MaintenancePage dehydratedState={undefined} />
    </div>
  )
}
