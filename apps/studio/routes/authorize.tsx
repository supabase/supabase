import { createFileRoute } from '@tanstack/react-router'

import APIAuthorizationPage from '@/pages/authorize'

export const Route = createFileRoute('/authorize')({
  component: Authorize,
})

function Authorize() {
  return <APIAuthorizationPage dehydratedState={undefined} />
}
