import { useParams } from 'common'
import { Documents } from 'components/interfaces/Organization/Documents/Documents'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const OrgDocuments: NextPageWithLayout = () => {
  const { slug } = useParams()

  const showLegalDocuments = useIsFeatureEnabled('organization:show_legal_documents')

  if (!showLegalDocuments) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return <Documents />
}

OrgDocuments.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgDocuments
