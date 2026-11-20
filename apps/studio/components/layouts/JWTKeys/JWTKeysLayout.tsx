import { useParams } from 'common'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { ScaffoldContainer } from '@/components/layouts/Scaffold'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const pathname = usePathname()

  const navigationItems = [
    {
      label: 'JWT Signing Keys',
      href: `/project/${projectRef}/settings/jwt`,
      id: 'signing-keys',
    },
    {
      label: 'Legacy JWT Secret',
      href: `/project/${projectRef}/settings/jwt/legacy`,
      id: 'legacy-jwt-keys',
    },
  ]

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>JWT Keys</PageHeaderTitle>
            <PageHeaderDescription>
              Control the keys used to sign JSON Web Tokens for your project
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
        <PageHeaderNavigationTabs>
          <NavMenu>
            {navigationItems.map((item) => (
              <NavMenuItem key={item.id} active={pathname === item.href}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </PageHeaderNavigationTabs>
      </PageHeader>
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </>
  )
}

export default JWTKeysLayout
