import { createFileRoute } from '@tanstack/react-router'

import CodePage from '@/pages/project/[ref]/functions/[functionSlug]/code'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/code')({
  component: FunctionCodeRoute,
  staticData: {
    edgeFunctionDetailsTitle: 'Code',
  },
})

function FunctionCodeRoute() {
  return <CodePage />
}
