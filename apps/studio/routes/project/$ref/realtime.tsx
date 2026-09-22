import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import RealtimeLayout from '@/components/layouts/RealtimeLayout/RealtimeLayout'

export const Route = createFileRoute('/project/$ref/realtime')({
  component: RealtimeShell,
})

function RealtimeShell() {
  // `select` form: only re-render when the selected title changes. See
  // routes/_app.tsx for the full rationale.
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { realtimeLayoutTitle?: string } | undefined)
        ?.realtimeLayoutTitle ?? '',
  })

  return (
    <RealtimeLayout title={title}>
      <Outlet />
    </RealtimeLayout>
  )
}
