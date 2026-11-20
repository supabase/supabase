import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { ComputeLayout } from '@/components/layouts/ComputeLayout/ComputeLayout'

export const Route = createFileRoute('/project/$ref/compute')({
  component: ComputeShell,
})

type ComputeStaticData = {
  computeLayoutTitle?: string
}

function ComputeShell() {
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as ComputeStaticData | undefined)
        ?.computeLayoutTitle ?? '',
  })

  return (
    <ComputeLayout title={title}>
      <Outlet />
    </ComputeLayout>
  )
}
