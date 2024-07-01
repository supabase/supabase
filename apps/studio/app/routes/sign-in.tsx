import { Outlet } from '@remix-run/react'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'

export default function SignIn() {
  return (
    <SignInLayout
      heading="Welcome back"
      subheading="Sign in to your account"
      logoLinkToMarketingSite={true}
    >
      <Outlet />
    </SignInLayout>
  )
}
