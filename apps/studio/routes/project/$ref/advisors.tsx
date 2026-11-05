import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'

export const Route = createFileRoute('/project/$ref/advisors')({
  component: AdvisorsShell,
})

type AdvisorsStaticData = {
  // The `advisors/rules` sub-shell wraps in its own <IssuesLayout> (mirroring the existing
  // AdvisorRulesLayout component), and the old advisor pages only redirect to /issues.
  // Without opting out here we'd double-wrap.
  skipAdvisorsLayout?: boolean
}

function AdvisorsShell() {
  // Scan the whole match chain — `skipAdvisorsLayout` is set on the
  // sub-shell route, not on the leaf. Same pattern as functions.tsx.
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as AdvisorsStaticData | undefined)?.skipAdvisorsLayout),
  })

  if (skip) return <Outlet />

  return (
    <IssuesLayout>
      <Outlet />
    </IssuesLayout>
  )
}
