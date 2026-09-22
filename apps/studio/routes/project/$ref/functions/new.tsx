import { createFileRoute } from '@tanstack/react-router'

import NewFunctionPage from '@/pages/project/[ref]/functions/new'

export const Route = createFileRoute('/project/$ref/functions/new')({
  component: FunctionsNewRoute,
  staticData: {
    functionsLayoutTitle: 'New',
  },
})

function FunctionsNewRoute() {
  return <NewFunctionPage />
}
