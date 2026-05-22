import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import { BreadcrumbItem, BreadcrumbList, BreadcrumbPage, NavMenu, NavMenuItem } from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageNav } from 'ui-patterns/PageNav'

import AuthLayout from './AuthLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const AUTH_EMAILS_NAV_ITEMS = [
  { label: 'Templates', href: '/auth/templates' },
  { label: 'SMTP Settings', href: '/auth/smtp' },
] as const

export const AuthEmailsLayout = ({ children }: PropsWithChildren) => {
  const { ref } = useParams()
  const router = useRouter()

  const showEmails = useIsFeatureEnabled('authentication:emails')

  return (
    <AuthLayout title="Emails">
      {showEmails ? (
        <div className="w-full min-h-full flex flex-col items-stretch">
          <PageBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Emails</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageBreadcrumbs>

          <PageNav>
            <NavMenu>
              {AUTH_EMAILS_NAV_ITEMS.map((item) => {
                const href = `/project/${ref}${item.href}`
                const isActive = router.asPath.split('?')[0] === href

                return (
                  <NavMenuItem key={item.label} active={isActive}>
                    <Link href={href}>{item.label}</Link>
                  </NavMenuItem>
                )
              })}
            </NavMenu>
          </PageNav>

          {children}
        </div>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/overview`} />
      )}
    </AuthLayout>
  )
}
