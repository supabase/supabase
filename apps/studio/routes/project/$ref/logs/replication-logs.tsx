import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/logs/replication-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Pipelines Logs' },
})

/** Redirects the previous Pipelines logs URL, keeping its filters, time range, and selection. */
function LogPage() {
  const { ref } = Route.useParams()

  return (
    <Navigate
      to="/project/$ref/logs/pipelines-logs"
      params={{ ref }}
      search={true}
      hash={true}
      replace
    />
  )
}
