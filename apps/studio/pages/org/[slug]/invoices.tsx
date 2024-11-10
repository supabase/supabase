import { InvoicesSettings } from 'components/interfaces/Organization'
import OrganizationLayout from 'app/(org)/org/layout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const OrgInvoices: NextPageWithLayout = () => {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return (
    <>
      {selectedOrganization === undefined && isLoadingPermissions ? (
        <Loading />
      ) : (
        <InvoicesSettings />
      )}
    </>
  )
}

OrgInvoices.getLayout = (page) => <OrganizationLayout pagesRouter>{page}</OrganizationLayout>
export default OrgInvoices
