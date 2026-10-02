import { createFileRoute } from '@tanstack/react-router'

import { IS_PLATFORM } from '@/lib/constants'
import User from '@/pages/account/me'

export const Route = createFileRoute('/_app/account/me')({
  component: AccountMePage,
  staticData: {
    defaultLayoutHeaderTitle: IS_PLATFORM ? 'Account' : 'Preferences',
    accountLayoutTitle: 'Preferences',
  },
})

function AccountMePage() {
  return <User dehydratedState={undefined} />
}
