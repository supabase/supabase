import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'

export const Route = createFileRoute('/_app/account')({
  component: AccountShell,
})

function AccountShell() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]?.staticData as
    | { accountLayoutTitle?: string }
    | undefined

  return (
    <AccountLayout title={leaf?.accountLayoutTitle ?? ''}>
      <Outlet />
    </AccountLayout>
  )
}
