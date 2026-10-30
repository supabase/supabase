import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'

export const Route = createFileRoute('/project/$ref/settings')({
  component: SettingsShell,
})

type SettingsStaticData = {
  settingsLayoutTitle?: string
  // settings/api is a redirect-only page; skip the SettingsLayout wrap
  // so we don't render the sidebar around a `return null`.
  skipSettingsLayout?: boolean
}

function SettingsShell() {
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as SettingsStaticData | undefined)?.skipSettingsLayout),
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as SettingsStaticData | undefined)
        ?.settingsLayoutTitle ?? '',
  })

  if (skip) return <Outlet />

  return (
    <SettingsLayout title={title}>
      <Outlet />
    </SettingsLayout>
  )
}
