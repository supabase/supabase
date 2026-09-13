import { createFileRoute, Outlet } from '@tanstack/react-router'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'

export const Route = createFileRoute('/project/$ref')({
  component: ProjectShell,
})

function ProjectShell() {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  )
}
