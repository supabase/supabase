import { useParams } from 'common'
import { Documents } from 'components/interfaces/Organization/Documents/Documents'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const OrgDocuments: NextPageWithLayout = () => {
  const { slug } = useParams()

  const showLegalDocuments = useIsFeatureEnabled('organization:show_legal_documents')

  if (!showLegalDocuments) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Legal documents</ScaffoldTitle>
          <ScaffoldDescription>Compliance documentation and legal agreements</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldDivider />
      <Documents />
    </>
  )
}

OrgDocuments.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout pageTitle="Legal Documents">{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgDocuments
