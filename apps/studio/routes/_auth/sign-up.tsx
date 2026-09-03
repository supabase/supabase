import { createFileRoute } from '@tanstack/react-router'

import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import SignUpPage from '@/pages/sign-up'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUp,
})

function SignUp() {
  return (
    <SignInLayout heading="Get started" subheading="Create a new account" inboundFlow="sign-up">
      <SignUpPage dehydratedState={undefined} />
    </SignInLayout>
  )
}
