import { createFileRoute } from '@tanstack/react-router'

import OAuthAppsPage from '@/pages/account/apps'

export const Route = createFileRoute('/_app/account/apps')({
  component: AccountOAuthAppsPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'OAuth Apps',
  },
})

function AccountOAuthAppsPage() {
  return <OAuthAppsPage dehydratedState={undefined} />
}
