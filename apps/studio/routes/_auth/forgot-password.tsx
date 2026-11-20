import { createFileRoute, Link } from '@tanstack/react-router'

import { ForgotPasswordWizard } from '@/components/interfaces/SignIn/ForgotPasswordWizard'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import { useHydratedQuery } from '@/hooks/misc/useHydratedQuery'
import { buildStudioPageTitle } from '@/lib/page-title'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Forgot password', brand: 'Supabase Dashboard' })

export const Route = createFileRoute('/_auth/forgot-password')({
  head: () => ({ meta: [{ title: PAGE_TITLE }] }),
  component: ForgotPassword,
})

function ForgotPassword() {
  return (
    <ForgotPasswordLayout
      heading="Forgot your password?"
      subheading="Enter your email and we'll send you a code to reset the password"
    >
      <ForgotPasswordPage />
    </ForgotPasswordLayout>
  )
}

function ForgotPasswordPage() {
  const query = useHydratedQuery()

  return (
    <>
      <div className="flex flex-col gap-4">
        <ForgotPasswordWizard />
      </div>

      <div className="my-8 self-center text-sm">
        <span className="text-foreground-light">Already have an account?</span>{' '}
        <Link to="/sign-in" search={query} className="underline hover:text-foreground-light">
          Sign in
        </Link>
      </div>
    </>
  )
}
