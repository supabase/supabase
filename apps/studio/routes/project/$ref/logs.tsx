import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'

export const Route = createFileRoute('/project/$ref/logs')({
  component: LogsShell,
})

type LogsStaticData = {
  logsLayoutTitle?: string
  // `logs/index` handles its own ProjectLayout-wrapped content
  // (UnifiedLogs view or no-permission interface) and only needs the
  // parent project shell's DefaultLayout — not LogsLayout. Opt out.
  skipLogsLayout?: boolean
}

function LogsShell() {
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as LogsStaticData | undefined)?.skipLogsLayout),
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as LogsStaticData | undefined)?.logsLayoutTitle ??
      '',
  })

  if (skip) return <Outlet />

  return (
    <LogsLayout title={title}>
      <Outlet />
    </LogsLayout>
  )
}
