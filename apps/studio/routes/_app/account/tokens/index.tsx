import { createFileRoute } from '@tanstack/react-router'

import UserAccessTokensPage from '@/pages/account/tokens'

export const Route = createFileRoute('/_app/account/tokens/')({
  component: AccountTokensPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Access Tokens',
  },
})

function AccountTokensPage() {
  return <UserAccessTokensPage dehydratedState={undefined} />
}
