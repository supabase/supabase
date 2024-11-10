import { Documents } from 'components/interfaces/Organization'
import OrganizationLayout from 'app/(org)/org/layout'
import type { NextPageWithLayout } from 'types'

const OrgDocuments: NextPageWithLayout = () => {
  return <Documents />
}

OrgDocuments.getLayout = (page) => <OrganizationLayout pagesRouter>{page}</OrganizationLayout>

export default OrgDocuments
