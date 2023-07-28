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
import { Button, IconExternalLink } from 'ui'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Access Tokens"
          description="Personal access tokens can be used with our management API or the iEchor CLI. These tokens will have the same permissions as you have."
        />
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Link href="https://iechor.com/docs/reference/api/introduction">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  API Docs
                </Button>
              </a>
            </Link>
            <Link href="https://iechor.com/docs/reference/cli/start">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  CLI docs
                </Button>
              </a>
            </Link>
          </div>
          <NewAccessTokenButton onCreateToken={setNewToken} />
        </div>
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
