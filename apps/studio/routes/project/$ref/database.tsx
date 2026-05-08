import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'

export const Route = createFileRoute('/project/$ref/database')({
  component: DatabaseShell,
})

function DatabaseShell() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]?.staticData as
    | { databaseLayoutTitle?: string }
    | undefined

  return (
    <DatabaseLayout title={leaf?.databaseLayoutTitle ?? ''}>
      <Outlet />
    </DatabaseLayout>
  )
}
