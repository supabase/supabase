import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  AccessTokenList,
  NewAccessTokenButton,
  NewTokenBanner,
} from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()

  return (
    <ScaffoldContainer>
      <ScaffoldHeader className="flex flex-row justify-between">
        <div className="flex flex-col">
          <ScaffoldTitle>Access Tokens</ScaffoldTitle>
          <ScaffoldDescription>
            Personal access tokens can be used with our Management API or CLI.
          </ScaffoldDescription>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/reference/api/introduction"
                target="_blank"
                rel="noreferrer"
              >
                API Docs
              </Link>
            </Button>
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
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
      </ScaffoldHeader>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <Admonition
            type="warning"
            title="Personal access tokens can be used to control your whole account and use features added in the future. Be careful when sharing them!"
            className="mb-6 w-full"
          />
        </div>
        <div className="space-y-4">
          {newToken && <NewTokenBanner token={newToken} />}
          <AccessTokenList />
        </div>
      </div>
    </ScaffoldContainer>
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
