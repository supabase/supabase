import { ExternalLink, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  AccessTokenList,
  NewAccessTokenButton,
  NewTokenBanner,
} from 'components/interfaces/Account/AccessTokens'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import { AccountSettingsLayout } from 'components/layouts/AccountLayout/AccountSettingsLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-0 mb-6">
          <ScaffoldSectionTitle>Access Tokens</ScaffoldSectionTitle>
          <ScaffoldDescription>
            Personal access tokens can be used to control your whole account and use features added
            in the future. Be careful when sharing them!
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <div className="space-y-4">
          {newToken && <NewTokenBanner token={newToken} />}
          <div className="flex items-center justify-between gap-x-2 mb-3">
            <Input
              size="tiny"
              autoComplete="off"
              icon={<Search size={12} />}
              value={searchString}
              onChange={(e: any) => setSearchString(e.target.value)}
              name="search"
              id="search"
              placeholder="Filter tokens"
            />
            <div className="flex items-center gap-x-2">
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

              <NewAccessTokenButton onCreateToken={setNewToken} />
            </div>
          </div>
          <AccessTokenList searchString={searchString} />
        </div>
      </ScaffoldContainer>
    </>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Access Tokens">
          <AccountSettingsLayout>{page}</AccountSettingsLayout>
        </AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default UserAccessTokens
