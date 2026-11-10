import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/database/triggers/')({
  component: DatabaseTriggersIndexPage,
})

function DatabaseTriggersIndexPage() {
  const { ref } = Route.useParams()

  return <Navigate to="/project/$ref/database/triggers/data" params={{ ref }} replace />
}
