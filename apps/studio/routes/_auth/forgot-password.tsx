import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import { buildStudioPageTitle } from '@/lib/page-title'
import ForgotPasswordPage from '@/pages/forgot-password'

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
      <ForgotPasswordPage dehydratedState={undefined} />
    </ForgotPasswordLayout>
  )
}
