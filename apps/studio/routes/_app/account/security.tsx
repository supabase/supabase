import { createFileRoute } from '@tanstack/react-router'

import SecurityPage from '@/pages/account/security'

export const Route = createFileRoute('/_app/account/security')({
  component: AccountSecurityPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Security',
  },
})

function AccountSecurityPage() {
  return <SecurityPage dehydratedState={undefined} />
}
