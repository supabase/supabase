import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'

export const Route = createFileRoute('/project/$ref/functions/$functionSlug')({
  component: FunctionDetailsShell,
  // EdgeFunctionDetailsLayout already wraps <EdgeFunctionsLayout>
  // internally. Tell the parent functions.tsx shell to skip its own
  // EdgeFunctionsLayout wrap so we don't double-wrap.
  staticData: {
    skipFunctionsLayout: true,
  },
})

function FunctionDetailsShell() {
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { edgeFunctionDetailsTitle?: string } | undefined)
        ?.edgeFunctionDetailsTitle ?? '',
  })

  return (
    <EdgeFunctionDetailsLayout title={title}>
      <Outlet />
    </EdgeFunctionDetailsLayout>
  )
}
