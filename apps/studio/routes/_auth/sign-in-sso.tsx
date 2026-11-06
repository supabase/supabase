import { createFileRoute } from '@tanstack/react-router'

import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { buildStudioPageTitle } from '@/lib/page-title'
import SignInSSOPage from '@/pages/sign-in-sso'

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Sign in with SSO',
  brand: 'Supabase Dashboard',
})

export const Route = createFileRoute('/_auth/sign-in-sso')({
  head: () => ({ meta: [{ title: PAGE_TITLE }] }),
  component: SignInSSO,
})

function SignInSSO() {
  return (
    <SignInLayout
      heading="Welcome back"
      subheading="Sign in to your enterprise account"
      logoLinkToMarketingSite={true}
    >
      <SignInSSOPage dehydratedState={undefined} />
    </SignInLayout>
  )
}
