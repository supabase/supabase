import { createFileRoute } from '@tanstack/react-router'

import EdgeFunctionsPage, {
  EdgeFunctionsIndexPageWrapper,
} from '@/pages/project/[ref]/functions/index'

export const Route = createFileRoute('/project/$ref/functions/')({
  component: FunctionsIndexRoute,
  staticData: {
    functionsLayoutTitle: 'Edge Functions',
  },
})

function FunctionsIndexRoute() {
  return (
    <EdgeFunctionsIndexPageWrapper>
      <EdgeFunctionsPage dehydratedState={undefined} />
    </EdgeFunctionsIndexPageWrapper>
  )
}
