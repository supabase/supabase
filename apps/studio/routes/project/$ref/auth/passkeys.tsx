import { createFileRoute } from '@tanstack/react-router'

import PasskeysPage from '@/pages/project/[ref]/auth/passkeys'

export const Route = createFileRoute('/project/$ref/auth/passkeys')({
  component: AuthPasskeysRoute,
  staticData: {
    authLayoutTitle: 'Passkeys',
  },
})

function AuthPasskeysRoute() {
  return <PasskeysPage dehydratedState={undefined} />
}
