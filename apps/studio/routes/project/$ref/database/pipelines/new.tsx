import { createFileRoute } from '@tanstack/react-router'

import PipelineCreationPage from '@/pages/project/[ref]/database/pipelines/new'

export const Route = createFileRoute('/project/$ref/database/pipelines/new')({
  staticData: { skipProjectLayout: true, skipDatabaseLayout: true },
  component: () => <PipelineCreationPage />,
})
