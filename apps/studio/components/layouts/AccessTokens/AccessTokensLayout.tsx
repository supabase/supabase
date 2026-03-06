import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useFlag } from 'common'
import { NavMenu, NavMenuItem } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const AccessTokensLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const scopedTokensEnabled = useFlag('scopedPAT')

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

  const title = 'Access Tokens'
  const description = 'Create and manage access tokens for API authentication.'

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{title}</PageHeaderTitle>
            <PageHeaderDescription>{description}</PageHeaderDescription>
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
      <PageContainer size="small" className="pt-8 pb-16">
        {children}
      </PageContainer>
    </>
  )
}

export default AccessTokensLayout
