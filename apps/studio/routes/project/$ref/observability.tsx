import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'

export const Route = createFileRoute('/project/$ref/observability')({
  component: ObservabilityShell,
})

function ObservabilityShell() {
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { observabilityLayoutTitle?: string } | undefined)
        ?.observabilityLayoutTitle ?? '',
  })

  return (
    <ObservabilityLayout title={title}>
      <Outlet />
    </ObservabilityLayout>
  )
}
