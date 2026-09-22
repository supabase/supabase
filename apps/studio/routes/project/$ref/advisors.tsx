import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import AdvisorsLayout from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'

export const Route = createFileRoute('/project/$ref/advisors')({
  component: AdvisorsShell,
})

type AdvisorsStaticData = {
  advisorsLayoutTitle?: string
  // The `advisors/rules` sub-shell wraps in its own <AdvisorsLayout>
  // (mirroring the existing AdvisorRulesLayout component). Without
  // opting out here we'd double-wrap.
  skipAdvisorsLayout?: boolean
}

function AdvisorsShell() {
  // Scan the whole match chain — `skipAdvisorsLayout` is set on the
  // sub-shell route, not on the leaf. Same pattern as functions.tsx.
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as AdvisorsStaticData | undefined)?.skipAdvisorsLayout),
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as AdvisorsStaticData | undefined)
        ?.advisorsLayoutTitle ?? '',
  })

  if (skip) return <Outlet />

  return (
    <AdvisorsLayout title={title}>
      <Outlet />
    </AdvisorsLayout>
  )
}
