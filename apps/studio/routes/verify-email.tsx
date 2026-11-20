import { createFileRoute } from '@tanstack/react-router'

import { SupportEmailVerification } from '@/components/interfaces/SupportEmailVerification/SupportEmailVerification'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
})

const PAGE_TITLE = buildStudioPageTitle({ section: 'Email Verification', brand: 'Supabase' })

function VerifyEmailPage() {
  return (
    <>
      <title>{PAGE_TITLE}</title>
      <SupportEmailVerification />
    </>
  )
}
