import { ReactNode } from 'react'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AuthLayout from './AuthLayout'
import { PageLayout } from 'components/layouts/PageLayout'

interface AuthProvidersLayoutProps {
  children: ReactNode
  projectRef: string
}

const AuthProvidersLayout = ({ children, projectRef }: AuthProvidersLayoutProps) => {
  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/project/${projectRef}/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/project/${projectRef}/auth/third-party`,
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

export default AuthProvidersLayout
