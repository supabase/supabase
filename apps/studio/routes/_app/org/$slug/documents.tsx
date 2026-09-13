import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import OrgDocumentsPage from '@/pages/org/[slug]/documents'

export const Route = createFileRoute('/_app/org/$slug/documents')({
  component: OrgDocuments,
  staticData: {
    orgLayoutTitle: 'Legal Documents',
  },
})

function OrgDocuments() {
  return (
    <OrganizationSettingsLayout>
      <OrgDocumentsPage dehydratedState={undefined} />
    </OrganizationSettingsLayout>
  )
}
