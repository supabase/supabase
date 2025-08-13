import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug, ref } = useParams()

  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/org/${slug}/project/${ref}/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/org/${slug}/project/${ref}/auth/third-party`,
    },
  ]

  return (
    <AuthLayout>
      <PageLayout
        title="Sign In / Providers"
        subtitle="Configure authentication providers and login methods for your users"
        navigationItems={navItems}
      >
        {children}
      </PageLayout>
    </AuthLayout>
  )
}
