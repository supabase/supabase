import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { AccessTokenList } from 'components/interfaces/Account/AccessTokens/AccessTokenList'
import { NewTokenButton } from 'components/interfaces/Account/AccessTokens/Classic/NewTokenButton'
import { AccessTokenNewBanner } from '@/components/interfaces/Account/AccessTokens/AccessTokenNewBanner/AccessTokenNewBanner'
import AccessTokensLayout from 'components/layouts/AccessTokens/AccessTokensLayout'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const UserAccessTokens: NextPageWithLayout = () => {
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  return (
    <AccessTokensLayout>
      <div className="space-y-4">
        {newToken && (
          <AccessTokenNewBanner
            token={newToken}
            onClose={() => setNewToken(undefined)}
            getTokenValue={(token) => token.token}
          />
        )}
        <div className="flex items-center justify-between gap-x-2 mb-3">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchString(e.target.value)}
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
            <NewTokenButton onCreateToken={setNewToken} />
          </div>
        </div>
        <AccessTokenList
          searchString={searchString}
          onDeleteSuccess={(id) => {
            if (id === newToken?.id) setNewToken(undefined)
          }}
        />
      </div>
    </AccessTokensLayout>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Access Tokens">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default UserAccessTokens
