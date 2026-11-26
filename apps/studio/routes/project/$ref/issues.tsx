import { createFileRoute, Outlet } from '@tanstack/react-router'

import { IssuesLayout } from '@/components/layouts/IssuesLayout/IssuesLayout'

export const Route = createFileRoute('/project/$ref/issues')({
  component: IssuesShell,
})

function IssuesShell() {
  return (
    <IssuesLayout>
      <Outlet />
    </IssuesLayout>
  )
}
