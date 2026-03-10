import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'

import AccessTokensLayout from 'components/layouts/AccessTokens/AccessTokensLayout'
import { NewScopedTokenButton } from 'components/interfaces/Account/AccessTokens/Scoped/NewScopedTokenButton'
import { AccessTokenNewBanner } from '@/components/interfaces/Account/AccessTokens/AccessTokenNewBanner/AccessTokenNewBanner'

import { ScopedTokenList } from 'components/interfaces/Account/AccessTokens/Scoped/ScopedTokenList'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { NewScopedAccessToken } from 'data/scoped-access-tokens/scoped-access-token-create-mutation'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const ScopedTokens: NextPageWithLayout = () => {
  const [searchString, setSearchString] = useState('')
  const [newToken, setNewToken] = useState<NewScopedAccessToken | undefined>()

  return (
    <AccessTokensLayout>
      <div className="space-y-4">
        {newToken && (
          <AccessTokenNewBanner
            token={newToken}
            onClose={() => setNewToken(undefined)}
            getTokenValue={(token) => token.token}
            getTokenPermissions={(token) => token.permissions}
          />
        )}
        <div className="flex items-center justify-between gap-x-2 mb-3">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(e: any) => setSearchString(e.target.value)}
            name="search"
            id="search"
            placeholder="Filter by name"
          />
          <div className="flex items-center gap-x-2">
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                href="https://supabase.com/docs/reference/api/introduction"
                target="_blank"
                rel="noreferrer"
              >
                API Docs
              </a>
            </Button>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                href="https://supabase.com/docs/reference/cli/start"
                target="_blank"
                rel="noreferrer"
              >
                CLI docs
              </a>
            </Button>
            <NewScopedTokenButton onCreateToken={setNewToken} />
          </div>
        </div>

        <ScopedTokenList
          searchString={searchString}
          onDeleteSuccess={(id) => {
            if (id === newToken?.id) setNewToken(undefined)
          }}
        />
      </div>
    </AccessTokensLayout>
  )
}

ScopedTokens.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Access Tokens">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default ScopedTokens
