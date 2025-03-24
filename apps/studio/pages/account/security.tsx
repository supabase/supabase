import { Smartphone } from 'lucide-react'

import { TOTPFactors } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AccountSettingsLayout from 'components/layouts/AccountLayout/AccountSettingsLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import type { NextPageWithLayout } from 'types'
import { Badge, cn, Collapsible } from 'ui'

const collapsibleClasses = [
  'bg-surface-100',
  'hover:bg-overlay-hover',
  'data-open:bg-selection',
  'border-default',
  'hover:border-strong data-open:border-strong',
  'data-open:pb-px col-span-12 rounded',
  '-space-y-px overflow-hidden',
  'border shadow',
  'transition',
  'hover:z-50',
]

const Security: NextPageWithLayout = () => {
  const { data } = useMfaListFactorsQuery()

  return (
    <>
      <FormHeader
        title="Multi-factor authentication"
        description="Add an additional layer of security to your account by requiring more than just a password to sign in."
      />
      <Collapsible className={cn(collapsibleClasses, 'w-full flex flex-1 flex-grow')}>
        <Collapsible.Trigger asChild>
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
        </Collapsible.Trigger>
        <Collapsible.Content className="group border-t border-default bg-surface-100 py-6 px-4 md:px-6 text-foreground">
          <TOTPFactors />
        </Collapsible.Content>
      </Collapsible>
    </>
  )
}

Security.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Security" breadcrumbs={[{ key: 'security', label: 'Security' }]}>
          <AccountSettingsLayout>{page}</AccountSettingsLayout>
        </AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Security
