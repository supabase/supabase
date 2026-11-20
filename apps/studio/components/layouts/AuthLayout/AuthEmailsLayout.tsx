import { useParams } from 'common'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'

import AuthLayout from './AuthLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const AuthEmailsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const pathname = usePathname()

  const showEmails = useIsFeatureEnabled('authentication:emails')

  const navItems = [
    {
      label: 'Templates',
      href: `/project/${ref}/auth/templates`,
    },
    {
      label: 'SMTP Settings',
      href: `/project/${ref}/auth/smtp`,
    },
  ]

  return (
    <AuthLayout title="Emails">
      {showEmails ? (
        <>
          <PageHeader>
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Emails</PageHeaderTitle>
                <PageHeaderDescription>
                  Configure what emails your users receive and how they are sent
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>
          <PageNav size="default">
            <NavMenu>
              {navItems.map((item) => (
                <NavMenuItem key={item.label} active={pathname === item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageNav>
          {children}
        </>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
