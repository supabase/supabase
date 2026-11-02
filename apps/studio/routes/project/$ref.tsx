import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'

export const Route = createFileRoute('/project/$ref')({
  component: ProjectShell,
})

function ProjectShell() {
  const shouldSkipLayout = useMatches({
    select: (matches) =>
      matches.some(
        (match) =>
          (match.staticData as { skipProjectLayout?: boolean } | undefined)?.skipProjectLayout
      ),
  })
  if (shouldSkipLayout) return <Outlet />

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  )
}
