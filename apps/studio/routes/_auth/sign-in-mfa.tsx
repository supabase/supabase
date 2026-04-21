import { createFileRoute } from '@tanstack/react-router'

import SignInMfaPage from '@/pages/sign-in-mfa'

export const Route = createFileRoute('/_auth/sign-in-mfa')({
  component: SignInMfa,
})

function SignInMfa() {
  // The Next page inlines its own SignInLayout; just render it.
  return <SignInMfaPage dehydratedState={undefined} />
}
