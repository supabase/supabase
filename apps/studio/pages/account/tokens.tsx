import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'

import { AccessTokenList } from 'components/interfaces/Account/AccessTokens/AccessTokenList'
import { NewAccessTokenButton } from 'components/interfaces/Account/AccessTokens/NewAccessTokenButton'
import { NewTokenBanner } from 'components/interfaces/Account/AccessTokens/NewTokenBanner'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-0">
          <ScaffoldSectionTitle>Access Tokens</ScaffoldSectionTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        <div className="space-y-4">
          {newToken && <NewTokenBanner token={newToken} onClose={() => setNewToken(undefined)} />}
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
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/reference/api/introduction`} target="_blank" rel="noreferrer">
                  API Docs
                </a>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
                <a href={`${DOCS_URL}/reference/cli/start`} target="_blank" rel="noreferrer">
                  CLI docs
                </a>
              </Button>
              <NewAccessTokenButton onCreateToken={setNewToken} />
            </div>
          </div>
          <AccessTokenList
            searchString={searchString}
            onDeleteSuccess={(id) => {
              if (id === newToken?.id) setNewToken(undefined)
            }}
          />
        </div>
      </ScaffoldContainer>
    </>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Access Tokens">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default UserAccessTokens
