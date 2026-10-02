import { createFileRoute } from '@tanstack/react-router'

import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import TemplatesPage from '@/pages/project/[ref]/auth/templates/index'

export const Route = createFileRoute('/project/$ref/auth/templates/')({
  component: AuthTemplatesIndexRoute,
  // AuthEmailsLayout wraps in <AuthLayout> internally; opt out of the
  // auth.tsx shell wrap to avoid double-wrapping. Sibling
  // templates/$templateId.tsx does NOT use AuthEmailsLayout, so we
  // can't share a templates.tsx sub-shell — each leaf wraps itself.
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthTemplatesIndexRoute() {
  return (
    <AuthEmailsLayout>
      <TemplatesPage dehydratedState={undefined} />
    </AuthEmailsLayout>
  )
}
