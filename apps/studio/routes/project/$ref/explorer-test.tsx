import { createFileRoute } from '@tanstack/react-router'

import { Explorer } from '@/domain/explorer/Explorer'

export const Route = createFileRoute('/project/$ref/explorer-test')({
  component: Explorer,
})
