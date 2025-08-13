import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

export const AuthEmailsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug, ref } = useParams()

  const navItems = [
    {
      label: 'Templates',
      href: `/org/${slug}/project/${ref}/auth/templates`,
    },
    {
      label: 'SMTP Settings',
      href: `/org/${slug}/project/${ref}/auth/smtp`,
    },
  ]

  return (
    <AuthLayout>
      <PageLayout
        title="Emails"
        subtitle="Configure what emails your users receive and how they are sent"
        navigationItems={navItems}
      >
        {children}
      </PageLayout>
    </AuthLayout>
  )
}
