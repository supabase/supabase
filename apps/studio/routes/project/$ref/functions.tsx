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
  // `skipFunctionsLayout` is set on the $functionSlug sub-shell's
  // staticData, not on the leaf — so checking only the leaf misses it
  // and we end up double-wrapping (`functions.tsx` adds
  // EdgeFunctionsLayout, then the sub-shell's EdgeFunctionDetailsLayout
  // wraps EdgeFunctionsLayout again internally → duplicated sidebar).
  // Scan the whole match chain instead.
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as FunctionsStaticData | undefined)?.skipFunctionsLayout),
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
