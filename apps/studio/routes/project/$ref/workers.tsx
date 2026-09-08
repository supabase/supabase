import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { WorkersLayout } from '@/components/layouts/WorkersLayout/WorkersLayout'

export const Route = createFileRoute('/project/$ref/workers')({
  component: WorkersShell,
})

type WorkersStaticData = {
  workersLayoutTitle?: string
}

function WorkersShell() {
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as WorkersStaticData | undefined)
        ?.workersLayoutTitle ?? '',
  })

  return (
    <WorkersLayout title={title}>
      <Outlet />
    </WorkersLayout>
  )
}
