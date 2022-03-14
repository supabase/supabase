import { withAuth } from 'hooks'
import { AccountLayout } from 'components/layouts'
import { AccessTokenList, NewAccessTokenButton } from 'components/interfaces/Account'

const UserAccessTokens = () => {
  return (
    <AccountLayout
      title="Supabase"
      breadcrumbs={[
        {
          key: `supabase-account-tokens`,
          label: 'Access Tokens',
        },
      ]}
    >
      <div className="p-4 pt-0 mt-4 space-y-8">
        <h2 className="text-xl">Access Tokens</h2>
        <NewAccessTokenButton />
        <AccessTokenList />
      </div>
    </AccountLayout>
  )
}

export default withAuth(UserAccessTokens)
