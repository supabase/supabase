import { createFileRoute } from '@tanstack/react-router'

import { AuthenticationLayout } from '@/components/layouts/AuthenticationLayout'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { buildStudioPageTitle } from '@/lib/page-title'
import SignInPage from '@/pages/sign-in'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Sign in', brand: 'Supabase Dashboard' })
const PAGE_DESCRIPTION =
  'Sign into the Supabase dashboard. Build production-grade applications with a Postgres database, Authentication, instant APIs, Realtime, Functions, Storage and Vector embeddings.'

export const Route = createFileRoute('/_auth/sign-in')({
  head: () => ({
    meta: [{ title: PAGE_TITLE }, { name: 'description', content: PAGE_DESCRIPTION }],
  }),
  component: SignIn,
})

function SignIn() {
  return (
    <AuthenticationLayout>
      <SignInLayout
        heading="Welcome back"
        subheading="Sign in to your account"
        logoLinkToMarketingSite={true}
        inboundFlow="sign-in"
        hasStatusBanner
      >
        <SignInPage dehydratedState={undefined} />
      </SignInLayout>
    </AuthenticationLayout>
  )
}
