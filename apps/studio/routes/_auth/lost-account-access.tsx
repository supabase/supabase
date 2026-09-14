import { createFileRoute } from '@tanstack/react-router'

import { ACCOUNT_RECOVERY_HEADER_TITLE } from '@/components/interfaces/SignIn/AccountRecovery.constants'
import { StandaloneFormPageLayout } from '@/components/layouts/StandaloneFormPageLayout'
import LostAccountAccessPage from '@/pages/lost-account-access'

export const Route = createFileRoute('/_auth/lost-account-access')({
  component: LostAccountAccess,
})

function LostAccountAccess() {
  return (
    <StandaloneFormPageLayout title={ACCOUNT_RECOVERY_HEADER_TITLE}>
      <LostAccountAccessPage dehydratedState={undefined} />
    </StandaloneFormPageLayout>
  )
}
