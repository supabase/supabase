import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/database/replication/$pipelineId')({
  component: Outlet,
  staticData: {
    databaseLayoutTitle: 'Replication',
  },
})
