import { ReactNode } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

interface AuthProvidersLayoutProps {
  children: ReactNode
}

export const AuthProvidersLayout = ({ children }: AuthProvidersLayoutProps) => {
  const { ref } = useParams()

  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/project/${ref}/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/project/${ref}/auth/third-party`,
    },
  ]

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Sign In / Up"
          subtitle="Configure authentication providers and login methods for your users"
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}
