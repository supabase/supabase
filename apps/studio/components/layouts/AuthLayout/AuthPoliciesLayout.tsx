import { ReactNode } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

interface AuthPoliciesLayoutProps {
  children: ReactNode
}

export const AuthPoliciesLayout = ({ children }: AuthPoliciesLayoutProps) => {
  const { ref } = useParams()

  const navItems = [
    {
      label: 'Policies',
      href: `/project/${ref}/auth/policies`,
    },
    {
      label: 'Tests',
      href: `/project/${ref}/auth/tests`,
    },
    {
      label: 'Diagnostics',
      href: `/project/${ref}/auth/diagnostics`,
    },
  ]

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          size="large"
          title="Row Level Security"
          subtitle="Manage access to your data with policies and test them to ensure they work as expected"
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}
