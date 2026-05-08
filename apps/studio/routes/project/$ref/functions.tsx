import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import EdgeFunctionsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'

export const Route = createFileRoute('/project/$ref/functions')({
  component: FunctionsShell,
})

type FunctionsStaticData = {
  functionsLayoutTitle?: string
  // The $functionSlug routes wrap themselves in <EdgeFunctionDetailsLayout>,
  // which already renders <EdgeFunctionsLayout> internally. Without
  // opting out here we'd double-wrap.
  skipFunctionsLayout?: boolean
}

function FunctionsShell() {
  const skip = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as FunctionsStaticData | undefined)
        ?.skipFunctionsLayout ?? false,
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as FunctionsStaticData | undefined)
        ?.functionsLayoutTitle ?? '',
  })

  if (skip) return <Outlet />

  return (
    <EdgeFunctionsLayout title={title}>
      <Outlet />
    </EdgeFunctionsLayout>
  )
}
