import { createFileRoute } from '@tanstack/react-router'

import { EdgeFunctionDetails } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug/details')({
  component: EdgeFunctionDetails,
  staticData: {
    edgeFunctionDetailsTitle: 'Settings',
  },
})
