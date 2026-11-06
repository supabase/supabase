import { createFileRoute } from '@tanstack/react-router'

import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { buildStudioPageTitle } from '@/lib/page-title'
import SignUpPage from '@/pages/sign-up'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Sign up', brand: 'Supabase Dashboard' })
const PAGE_DESCRIPTION =
  'Sign up for Supabase. Start for free. Build production-grade applications with a Postgres database, Authentication, instant APIs, Realtime, Functions, Storage and Vector embeddings.'

export const Route = createFileRoute('/_auth/sign-up')({
  head: () => ({
    meta: [{ title: PAGE_TITLE }, { name: 'description', content: PAGE_DESCRIPTION }],
  }),
  component: SignUp,
})

function SignUp() {
  return (
    <SignInLayout heading="Get started" subheading="Create a new account" inboundFlow="sign-up">
      <SignUpPage dehydratedState={undefined} />
    </SignInLayout>
  )
}
