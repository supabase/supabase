import { createFileRoute } from '@tanstack/react-router'

import VerifyEmailPage from '@/pages/verify-email'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  return <VerifyEmailPage dehydratedState={undefined} />
}
