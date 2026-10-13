import { parseAsString, useQueryState } from 'nuqs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { AccountIdentities } from '@/components/interfaces/Account/Preferences/AccountIdentities'
import { getPrimarySecurityAction } from '@/components/interfaces/Account/Security/Security.utils'
import { TOTPFactors } from '@/components/interfaces/Account/TOTPFactors'
import { getRecoveryCodesPreview } from '@/components/interfaces/Account/TOTPFactors/RecoveryCodesPreview.utils'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { evaluateAccountRecovery } from '@/lib/account-recovery/evaluate-account-recovery'
import type { NextPageWithLayout } from '@/types'

const Security: NextPageWithLayout = () => {
  const showSecuritySettings = useIsFeatureEnabled('account:show_security_settings')

  const [mockRecoveryCodes] = useQueryState('mockRecoveryCodes', parseAsString)
  const previewRemaining = getRecoveryCodesPreview({
    value: mockRecoveryCodes,
    environment: process.env.NODE_ENV,
    hostname: typeof window === 'undefined' ? '' : window.location.hostname,
  })
  let previewFactorCount = 1
  if (previewRemaining === 'mfa-off') previewFactorCount = 0
  if (previewRemaining === 'backup') previewFactorCount = 2
  const previewHasCodes = previewRemaining !== 'missing' && previewRemaining !== 'mfa-off'
  const previewCodeCount = typeof previewRemaining === 'number' ? previewRemaining : 10
  const recovery = useAccountRecovery({
    enabled: showSecuritySettings && previewRemaining === undefined,
  })
  const findings =
    previewRemaining === undefined
      ? recovery.findings
      : evaluateAccountRecovery({
          identities: [{ provider: 'email' }],
          email: 'preview@example.com',
          verifiedFactorCount: previewFactorCount,
          recoveryCodes: previewHasCodes
            ? { status: 'available', remaining: previewCodeCount }
            : { status: 'missing' },
          features: {
            hasSecuritySettings: true,
            recoveryCodesEnabled: true,
            passwordEnabled: false,
          },
        })
  const primaryAction = getPrimarySecurityAction({
    findings,
    isPending: previewRemaining === undefined && recovery.isPending,
    isError: previewRemaining === undefined && recovery.isError,
    canEnableMfa:
      previewRemaining === undefined
        ? recovery.isFactorsSuccess && recovery.verifiedFactorCount === 0
        : previewFactorCount === 0,
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
              Manage how you sign in, protect your account, and recover access.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <AccountIdentities findings={findings} primaryAction={primaryAction} />
        <TOTPFactors
          findings={findings}
          primaryAction={primaryAction}
          previewRemaining={previewRemaining}
        />
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
