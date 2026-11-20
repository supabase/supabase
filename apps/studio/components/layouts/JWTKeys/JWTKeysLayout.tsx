import { useParams } from 'common'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

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
      </PageHeader>
      <PageNav size="default">
        <NavMenu>
          {navigationItems.map((item) => (
            <NavMenuItem key={item.id} active={pathname === item.href}>
              <Link href={item.href}>{item.label}</Link>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>
      <PageContainer className="flex flex-col py-8 pb-16 gap-8">{children}</PageContainer>
    </>
  )
}

export default JWTKeysLayout
