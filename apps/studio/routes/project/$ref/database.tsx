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
  //
  // `replication/new` is a full-canvas stepped page: project chrome stays, the
  // Database product menu does not. That leaf sets `skipDatabaseLayout: true`
  // and wraps itself in ProjectLayoutWithAuth. Scan the whole match chain
  // (same pattern as advisors/functions) so a parent declaration also works.
  const skipDatabaseLayout = useMatches({
    select: (matches) =>
      matches.some(
        (m) => (m.staticData as { skipDatabaseLayout?: boolean } | undefined)?.skipDatabaseLayout
      ),
  })
  const title = useMatches({
    select: (matches) => {
      // Walk up from the leaf to the nearest match that declares a title.
      // Section layouts like `database/triggers.tsx` set `databaseLayoutTitle`
      // while their leaf children (`triggers/data`, `triggers/event`, the
      // index) don't, so a leaf-only read would drop the title to ''.
      for (let i = matches.length - 1; i >= 0; i--) {
        const data = matches[i]?.staticData as { databaseLayoutTitle?: string } | undefined
        if (typeof data?.databaseLayoutTitle === 'string') return data.databaseLayoutTitle
      }
      return ''
    },
  })

  if (skipDatabaseLayout) {
    return <Outlet />
  }

  return (
    <DatabaseLayout title={title}>
      <Outlet />
    </DatabaseLayout>
  )
}
