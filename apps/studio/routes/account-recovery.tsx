import { createFileRoute } from '@tanstack/react-router'

import AccountRecoveryPage from '@/pages/account-recovery'

export const Route = createFileRoute('/account-recovery')({
  component: AccountRecovery,
})

function AccountRecovery() {
  return <AccountRecoveryPage dehydratedState={undefined} />
}
