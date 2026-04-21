import { createFileRoute } from '@tanstack/react-router'

import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import OrgIndexPage from '@/pages/org/index'

export const Route = createFileRoute('/_app/org/')({
  component: OrgIndex,
})

function OrgIndex() {
  return (
    <OrganizationLayout title="Organizations">
      <OrgIndexPage dehydratedState={undefined} />
    </OrganizationLayout>
  )
}
