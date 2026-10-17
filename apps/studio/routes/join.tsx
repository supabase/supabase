import { createFileRoute } from '@tanstack/react-router'

import JoinOrganizationPage from '@/pages/join'

export const Route = createFileRoute('/join')({
  component: Join,
})

function Join() {
  return <JoinOrganizationPage dehydratedState={undefined} />
}
