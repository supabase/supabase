import { ReactNode } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

interface AuthEmailsLayoutProps {
  children: ReactNode
}

export const AuthEmailsLayout = ({ children }: AuthEmailsLayoutProps) => {
  const { ref } = useParams()

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
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Emails"
          subtitle="Configure what emails your users receive and how they are sent"
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}
