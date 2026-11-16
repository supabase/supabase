import { createFileRoute } from '@tanstack/react-router'

import { AlertIssueDetail } from '@/components/interfaces/Issues/AlertIssueDetail'

export const Route = createFileRoute('/project/$ref/issues/alerts/$alertIssueId')({
  component: AlertIssueDetail,
})
