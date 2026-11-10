import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { useFlag } from 'common'

import { AdvisorsLayout } from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'

export const Route = createFileRoute('/project/$ref/advisors')({
  component: AdvisorsShell,
})

type AdvisorsStaticData = {
  skipAdvisorsLayout?: boolean
}

function AdvisorsShell() {
  const isIssuesInboxEnabled = useFlag('issuesInbox')
  const Layout = isIssuesInboxEnabled ? IssuesLayout : AdvisorsLayout
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as AdvisorsStaticData | undefined)?.skipAdvisorsLayout),
  })

  if (skip) return <Outlet />

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
