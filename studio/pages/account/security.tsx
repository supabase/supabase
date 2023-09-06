import { NextPageWithLayout } from 'types'
import { Badge, cn, Collapsible, IconSmartphone } from 'ui'

import { TOTPFactors } from 'components/interfaces/Account'
import { AccountLayout } from 'components/layouts'
import { FormHeader } from 'components/ui/Forms'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'

const collapsibleClasses = [
  'bg-scale-100 dark:bg-scale-300',
  'hover:bg-scale-200 dark:hover:bg-scale-500',
  'data-open:bg-scale-200 dark:data-open:bg-scale-500',
  'border-scale-300',
  'dark:border-scale-500 hover:border-scale-500',
  'dark:hover:border-scale-700 data-open:border-scale-700',
  'data-open:pb-px col-span-12 rounded',
  '-space-y-px overflow-hidden',
  'border shadow',
  'transition',
  'hover:z-50',
]

const Security: NextPageWithLayout = () => {
  const { data } = useMfaListFactorsQuery()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Multi-factor authentication"
          description="Add an additional layer of security to your account by requiring more than just a password to sign in."
        />
      </div>
      <Collapsible className={cn(collapsibleClasses)}>
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
          >
            <div className="flex flex-row gap-4 items-center py-1">
              <IconSmartphone strokeWidth={1.5} />
              <span className="text-sm">Authenticator app</span>
            </div>

            {data ? (
              <Badge color={data.totp.length === 0 ? 'gray' : 'green'}>
                {data.totp.length} app{data.totp.length === 1 ? '' : 's'} configured
              </Badge>
            ) : null}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="group border-t border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300">
          <TOTPFactors />
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}

Security.getLayout = (page) => (
  <AccountLayout title="Security" breadcrumbs={[{ key: 'security', label: 'Security' }]}>
    {page}
  </AccountLayout>
)

export default Security
