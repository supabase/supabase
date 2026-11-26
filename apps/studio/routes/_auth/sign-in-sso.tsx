import { createFileRoute } from '@tanstack/react-router'

import { SignInSSOForm } from '@/components/interfaces/SignIn/SignInSSOForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { buildStudioPageTitle } from '@/lib/page-title'

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
      <SignInSSOPage />
    </SignInLayout>
  )
}

function SignInSSOPage() {
  const signInWithSSOEnabled = useIsFeatureEnabled('dashboard_auth:sign_in_with_sso')

  if (!signInWithSSOEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInSSOForm />
      </div>

      <div className="my-8 self-center text-sm">
        <div>
          <span className="text-foreground-light">Interested in SSO?</span>{' '}
          <a
            href="https://supabase.com/contact/enterprise"
            rel="noopener noreferrer"
            className="underline text-foreground hover:text-foreground-light transition"
          >
            Let us know
          </a>
        </div>
      </div>
    </>
  )
}
