import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useRouter } from 'next/router'
import AuthLayout from './AuthLayout'

export const AuthEmailsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const router = useRouter()
  const showEmails = useIsFeatureEnabled('authentication:emails')

  // Keep the template tab active when on an individual template page /auth/templates/[templateId]
  const isOnTemplatePage = router.asPath.includes('/auth/templates')

  const navItems = [
    {
      label: 'Templates',
      href: `/project/${ref}/auth/templates`,
      active: isOnTemplatePage,
    },
    {
      label: 'SMTP Settings',
      href: `/project/${ref}/auth/smtp`,
    },
  ]

  return (
    <AuthLayout>
      {showEmails ? (
        <PageLayout
          title="Emails"
          subtitle="Configure what emails your users receive and how they are sent"
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
