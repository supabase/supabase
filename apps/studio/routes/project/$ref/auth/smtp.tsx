import { createFileRoute } from '@tanstack/react-router'

import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import SmtpPage from '@/pages/project/[ref]/auth/smtp'

export const Route = createFileRoute('/project/$ref/auth/smtp')({
  component: AuthSmtpRoute,
  // AuthEmailsLayout wraps in <AuthLayout> internally; opt out of the
  // auth.tsx shell wrap to avoid double-wrapping.
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthSmtpRoute() {
  return (
    <AuthEmailsLayout>
      <SmtpPage dehydratedState={undefined} />
    </AuthEmailsLayout>
  )
}
