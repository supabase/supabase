import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/account/tokens/scoped')({
  component: AccountScopedTokensPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Access Tokens',
  },
})

function AccountScopedTokensPage() {
  return <Navigate to="/account/tokens" replace />
}
