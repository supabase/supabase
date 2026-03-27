'use client'

import { AppLayout } from 'components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'

export default function V2OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <DefaultLayout hideMobileMenu headerTitle="Organizations">
        <PageLayout title="Your Organizations" className="max-w-[1200px] lg:px-6 mx-auto">
          {children}
        </PageLayout>
      </DefaultLayout>
    </AppLayout>
  )
}
