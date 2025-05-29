import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AuthenticationLayout } from 'components/layouts/AuthenticationLayout'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthenticationLayout>
      <SignInLayout
        heading="Welcome back"
        subheading="Sign in to your account"
        logoLinkToMarketingSite={true}
      >
        <Outlet />
      </SignInLayout>
    </AuthenticationLayout>
  )
}
