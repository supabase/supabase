import { useState } from 'react'
import { NextPageWithLayout } from 'types'
import { FormHeader } from 'components/ui/Forms'
import { AccountLayout } from 'components/layouts'
import {
  AccessTokenList,
  NewTokenBanner,
  NewAccessTokenButton,
} from 'components/interfaces/Account'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'

import Link from 'next/link'
import { Alert, Button, IconExternalLink } from 'ui'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
      <div className="flex items-center justify-between">
        <div>
          <FormHeader
            title="Access Tokens"
            description="Personal access tokens can be used with our Management API or CLI."
          />
        </div>
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/reference/api/introduction"
                target="_blank"
                rel="noreferrer"
              >
                API Docs
              </Link>
            </Button>
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/reference/cli/start"
                target="_blank"
                rel="noreferrer"
              >
                CLI docs
              </Link>
            </Button>
          </div>
          <NewAccessTokenButton onCreateToken={setNewToken} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Alert
          withIcon
          className="mb-6 w-full"
          variant="warning"
          title="Personal access tokens can be used to control your whole account and use features added in the future. Be careful when sharing them!"
        />
      </div>
      <div className="space-y-4">
        {newToken && <NewTokenBanner token={newToken} />}
        <AccessTokenList />
      </div>
    </div>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AccountLayout
    title="Access Tokens"
    breadcrumbs={[{ key: 'supabase-account-tokens', label: 'Access Tokens' }]}
  >
    {page}
  </AccountLayout>
)

export default UserAccessTokens
