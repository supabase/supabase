import { Smartphone } from 'lucide-react'

import { TOTPFactors } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'

const collapsibleClasses = [
  'bg-surface-100',
  'hover:bg-surface-200',
  'data-open:bg-surface-200',
  'border-default',
  'hover:border-strong data-open:border-strong',
  'data-open:pb-px col-span-12 rounded',
  '-space-y-px overflow-hidden',
  'border shadow',
  'transition',
  'hover:z-50',
]

const Security: NextPageWithLayout = () => {
  const showSecuritySettings = useIsFeatureEnabled('account:show_security_settings')

  const { data } = useMfaListFactorsQuery({ enabled: showSecuritySettings })

  if (!showSecuritySettings) {
    return <UnknownInterface urlBack={`/account/me`} />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-0">
          <ScaffoldSectionTitle>Security</ScaffoldSectionTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <Collapsible_Shadcn_ className={cn(collapsibleClasses)}>
          <CollapsibleTrigger_Shadcn_ asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded py-3 px-4 md:px-6 text-foreground"
            >
              <div className="flex flex-row gap-4 items-center py-1">
                <Smartphone strokeWidth={1.5} />
                <span className="text-sm">Authenticator app</span>
              </div>

              {data ? (
                <Badge variant={data.totp.length === 0 ? 'default' : 'brand'}>
                  {data.totp.length} app{data.totp.length === 1 ? '' : 's'} configured
                </Badge>
              ) : null}
            </button>
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="group border-t border-default bg-surface-100 py-6 px-4 md:px-6 text-foreground">
            <TOTPFactors />
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>
      </ScaffoldContainer>
    </>
  )
}

Security.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Security">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Security
