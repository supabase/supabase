import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { SignInMethods } from '@/components/interfaces/Account/Preferences/SignInMethods'
import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import { TOTPFactors } from '@/components/interfaces/Account/TOTPFactors'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'

export const Route = createFileRoute('/_app/account/security')({
  component: AccountSecurityPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Security',
  },
})

function AccountSecurityPage() {
  const recovery = useAccountRecovery()
  const primaryAction = getPrimarySecurityAction({
    findings: recovery.findings,
    isPending: recovery.isPending,
    isError: recovery.isError,
    canEnableMfa: recovery.isFactorsSuccess && recovery.verifiedFactorCount === 0,
  })

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Security</PageHeaderTitle>
            <PageHeaderDescription>
              Manage how you sign in, protect your account, and recover access.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <SignInMethods primaryAction={primaryAction} />
        <TOTPFactors findings={recovery.findings} primaryAction={primaryAction} />
      </PageContainer>
    </>
  )
}
