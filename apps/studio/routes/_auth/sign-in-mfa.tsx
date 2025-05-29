import { createFileRoute } from '@tanstack/react-router'
import SignInMfaPage from 'pages/sign-in-mfa'

export const Route = createFileRoute('/_auth/sign-in-mfa')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignInMfaPage dehydratedState={undefined} />
}
