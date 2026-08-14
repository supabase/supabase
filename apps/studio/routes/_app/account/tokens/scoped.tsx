import { createFileRoute } from '@tanstack/react-router'

import ScopedTokensPage from '@/pages/account/tokens/scoped'

export const Route = createFileRoute('/_app/account/tokens/scoped')({
  component: AccountScopedTokensPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Access Tokens',
  },
})

function AccountScopedTokensPage() {
  return <ScopedTokensPage dehydratedState={undefined} />
}
