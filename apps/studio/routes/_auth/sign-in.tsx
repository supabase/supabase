import { createFileRoute } from '@tanstack/react-router'
import SignInPage from 'pages/sign-in'

export const Route = createFileRoute('/_auth/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignInPage dehydratedState={undefined} />
}
