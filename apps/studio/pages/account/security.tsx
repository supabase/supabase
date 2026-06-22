import { Lock } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { TOTPFactors } from '@/components/interfaces/Account/TOTPFactors'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'

const Security: NextPageWithLayout = () => {
  const showSecuritySettings = useIsFeatureEnabled('account:show_security_settings')

  const { data } = useMfaListFactorsQuery({ enabled: showSecuritySettings })

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
        <Card className="mt-8">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div className="flex flex-row gap-4 items-center py-1 mb-0">
              <Lock size={18} strokeWidth={1.5} />
              <span className="text-sm">Multi-factor authentication (MFA)</span>
            </div>

            {data ? (
              <Badge variant={data.totp.length === 0 ? 'default' : 'success'}>
                {data.totp.length} app{data.totp.length === 1 ? '' : 's'} configured
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            <TOTPFactors />
          </CardContent>
        </Card>
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
