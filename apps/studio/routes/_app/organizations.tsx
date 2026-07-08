import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import OrganizationsPage from '@/pages/organizations'

export const Route = createFileRoute('/_app/organizations')({
  component: Organizations,
  staticData: {
    defaultLayoutHeaderTitle: 'Organizations',
    hideMobileMenu: true,
  },
})

function Organizations() {
  // Next page default export is already wrapped in withAuth.
  return (
    <PageLayout title="Your Organizations" className="max-w-[1200px] lg:px-6 mx-auto">
      <OrganizationsPage dehydratedState={undefined} />
    </PageLayout>
  )
}
