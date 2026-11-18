import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { Documents } from '@/components/interfaces/Organization/Documents/Documents'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { ScaffoldDivider } from '@/components/layouts/Scaffold'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const Route = createFileRoute('/_app/org/$slug/documents')({
  component: OrgDocuments,
  staticData: {
    orgLayoutTitle: 'Legal Documents',
  },
})

function OrgDocuments() {
  return (
    <OrganizationSettingsLayout>
      <OrgDocumentsPage />
    </OrganizationSettingsLayout>
  )
}

function OrgDocumentsPage() {
  const { slug } = useParams()

  const showLegalDocuments = useIsFeatureEnabled('organization:show_legal_documents')

  if (!showLegalDocuments) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return (
    <>
      <PageHeader size="default" className="pb-12">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Legal Documents</PageHeaderTitle>
            <PageHeaderDescription>
              Compliance documentation and legal agreements
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <ScaffoldDivider />
      <Documents />
    </>
  )
}
