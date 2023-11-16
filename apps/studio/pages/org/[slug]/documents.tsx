import { NextPageWithLayout } from 'types'
import { OrganizationLayout } from 'components/layouts'
import { Documents } from 'components/interfaces/Organization'

const OrgDocuments: NextPageWithLayout = () => {
  return <Documents />
}

OrgDocuments.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgDocuments
