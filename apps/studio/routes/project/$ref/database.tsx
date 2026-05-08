import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'

export const Route = createFileRoute('/project/$ref/database')({
  component: DatabaseShell,
})

function DatabaseShell() {
  // useMatches() returns a fresh array reference on every router tick, which
  // re-renders the shell (and its subtree, e.g. DatabaseLayout → ProjectLayout
  // → the route content) even when the leaf staticData hasn't changed. The
  // `select` form lets TanStack compare the selected value (a string) and
  // only re-render when it actually changes — required to keep heavy children
  // like ReactFlow stable, otherwise their internal compose-refs chain runs
  // setRef → setState every render and trips React's max-update-depth.
  const title = useMatches({
    select: (matches) => {
      const leaf = matches[matches.length - 1]?.staticData as
        | { databaseLayoutTitle?: string }
        | undefined
      return leaf?.databaseLayoutTitle ?? ''
    },
  })

  return (
    <DatabaseLayout title={title}>
      <Outlet />
    </DatabaseLayout>
  )
}
