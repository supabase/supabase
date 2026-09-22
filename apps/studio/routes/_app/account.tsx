import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'

export const Route = createFileRoute('/_app/account')({
  component: AccountShell,
})

function AccountShell() {
  // `select` form: only re-render when the selected title changes, not on
  // every router tick. See routes/_app.tsx for the full rationale.
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { accountLayoutTitle?: string } | undefined)
        ?.accountLayoutTitle ?? '',
  })

  return (
    <AccountLayout title={title}>
      <Outlet />
    </AccountLayout>
  )
}
