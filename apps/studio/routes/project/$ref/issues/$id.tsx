import { createFileRoute } from '@tanstack/react-router'

import { IssueDetail } from '@/components/interfaces/Issues/IssueDetail'

export const Route = createFileRoute('/project/$ref/issues/$id')({
  component: IssueDetail,
})
