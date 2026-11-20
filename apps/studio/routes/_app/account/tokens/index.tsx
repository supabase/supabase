import { createFileRoute } from '@tanstack/react-router'
import { useFlag } from 'common'
import { ExternalLinkIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { AccessTokenList } from '@/components/interfaces/Account/AccessTokens/AccessTokenList'
import { AccessTokenNewBanner } from '@/components/interfaces/Account/AccessTokens/AccessTokenNewBanner/AccessTokenNewBanner'
import { NewTokenButton } from '@/components/interfaces/Account/AccessTokens/Classic/NewTokenButton'
import { MigrationAdmonition } from '@/components/interfaces/Account/AccessTokens/MigrationAdmonition'
import { NewScopedTokenSheet } from '@/components/interfaces/Account/AccessTokens/Scoped/NewScopedTokenSheet'
import { AccessTokensLayout } from '@/components/layouts/AccessTokens/AccessTokensLayout'
import { NewAccessToken } from '@/data/access-tokens/access-tokens-create-mutation'
import { NewScopedAccessToken } from '@/data/scoped-access-tokens/scoped-access-token-create-mutation'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/_app/account/tokens/')({
  component: AccountTokensPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Access Tokens',
  },
})

function AccountTokensPage() {
  const scopedTokensEnabled = useFlag('scopedPAT')
  const [newToken, setNewToken] = useState<NewScopedAccessToken | NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  return (
    <AccessTokensLayout>
      <div className="space-y-4">
        {scopedTokensEnabled && <MigrationAdmonition />}
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
            icon={<SearchIcon size={12} />}
            value={searchString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchString(e.target.value)}
            name="search"
            id="search"
            placeholder="Filter tokens"
          />
          <div className="flex items-center gap-x-2">
            <Button asChild icon={<ExternalLinkIcon />}>
              <a href={`${DOCS_URL}/reference/api/introduction`} target="_blank" rel="noreferrer">
                API Docs
              </a>
            </Button>
            <Button asChild icon={<ExternalLinkIcon />}>
              <a href={`${DOCS_URL}/reference/cli/start`} target="_blank" rel="noreferrer">
                CLI docs
              </a>
            </Button>
            {scopedTokensEnabled ? (
              <NewScopedTokenSheet onCreateExperimentalToken={setNewToken} />
            ) : (
              <NewTokenButton onCreateToken={setNewToken} />
            )}
          </div>
        </div>
        <AccessTokenList
          searchString={searchString}
          onDeleteSuccess={(id) => {
            if (id === newToken?.id) setNewToken(undefined)
          }}
          scopedTokensEnabled={scopedTokensEnabled}
        />
      </div>
    </AccessTokensLayout>
  )
}
