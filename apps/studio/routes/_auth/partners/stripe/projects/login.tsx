import { createFileRoute } from '@tanstack/react-router'

import StripeProjectsLoginPage from '@/pages/partners/stripe/projects/login'

export const Route = createFileRoute('/_auth/partners/stripe/projects/login')({
  component: StripeProjectsLogin,
})

function StripeProjectsLogin() {
  // Next page default export is already wrapped in withAuth and inlines InterstitialLayout.
  return <StripeProjectsLoginPage dehydratedState={undefined} />
}
