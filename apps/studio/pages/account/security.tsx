import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import { TOTPFactors } from '@/components/interfaces/Account/TOTPFactors'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const Security: NextPageWithLayout = () => {
  const showSecuritySettings = useIsFeatureEnabled('account:show_security_settings')

  const recovery = useAccountRecovery({ enabled: showSecuritySettings })
  const primaryAction = getPrimarySecurityAction({
    findings: recovery.findings.filter((finding) => finding.action !== 'set-password'),
    isPending: recovery.isPending,
    isError: recovery.isError,
    canEnableMfa: recovery.isFactorsSuccess && recovery.verifiedFactorCount === 0,
  })

  if (!showSecuritySettings) {
    return <UnknownInterface urlBack={`/account/me`} />
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Security</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your account security settings and authentication methods.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <TOTPFactors findings={recovery.findings} primaryAction={primaryAction} />
      </PageContainer>
    </>
  )
}

Security.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <AccountLayout title="Security">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Security
