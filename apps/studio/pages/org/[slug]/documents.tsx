import { Documents } from 'components/interfaces/Organization'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import type { NextPageWithLayout } from 'types'

const OrgDocuments: NextPageWithLayout = () => {
  return <Documents />
}

OrgDocuments.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default OrgDocuments
