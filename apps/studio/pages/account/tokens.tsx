import Link from 'next/link'
import { useRouter } from 'next/router'
import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { AccessTokenList } from 'components/interfaces/Account/AccessTokens/AccessTokenList'
import { NewTokenButton } from 'components/interfaces/Account/AccessTokens/Classic/NewTokenButton'
import { AccessTokenNewBanner } from 'components/interfaces/Account/AccessTokens/AccessTokenNewBanner'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button, NavMenu, NavMenuItem } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { useFlag } from 'common'

const UserAccessTokens: NextPageWithLayout = () => {
  const router = useRouter()
  const scopedTokensEnabled = useFlag('scopedPAT')
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  const navigationItems = [
    {
      label: 'Classic Tokens',
      href: `/account/tokens`,
      id: 'classic-tokens',
    },
    ...(scopedTokensEnabled
      ? [
        {
          label: 'Scoped Tokens',
          href: `/account/tokens/scoped`,
          id: 'scoped-tokens',
        },
      ]
      : []),
  ]

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Access Tokens</PageHeaderTitle>
            <PageHeaderDescription>
              Create and manage personal access tokens for API authentication.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
        {navigationItems.length > 0 && (
          <PageHeaderNavigationTabs>
            <NavMenu>
              {navigationItems.map((item) => {
                const isActive = router.asPath.split('?')[0] === item.href
                return (
                  <NavMenuItem key={item.label} active={isActive}>
                    <Link href={item.href}>{item.label}</Link>
                  </NavMenuItem>
                )
              })}
            </NavMenu>
          </PageHeaderNavigationTabs>
        )}
      </PageHeader>
      <PageContainer size="small" className="mt-8">
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
      </PageContainer>
    </>
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