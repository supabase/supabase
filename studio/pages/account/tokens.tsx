import { AccountLayout } from 'components/layouts'
import { AccessTokenList, NewAccessTokenButton } from 'components/interfaces/Account'
import { NextPageWithLayout } from 'types'

const UserAccessTokens: NextPageWithLayout = () => {
  return (
    <div className="mt-4 space-y-8 p-4 pt-0">
      <h2 className="text-xl">Access Tokens</h2>
      <NewAccessTokenButton />
      <AccessTokenList />
    </div>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AccountLayout
    title="Supabase"
    breadcrumbs={[
      {
        key: 'supabase-account-tokens',
        label: 'Access Tokens',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default UserAccessTokens
