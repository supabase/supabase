import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import BillingAddressForm from './BillingAddressForm'

const BillingAddress = () => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const canReadBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )
  const canUpdateBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const { data, error, isLoading, isSuccess, isError } = useOrganizationCustomerProfileQuery(
    { slug },
    { enabled: canReadBillingAddress }
  )

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-3">
          <p className="text-foreground text-base m-0">Billing Address</p>
          <p className="text-sm text-foreground-light m-0">
            This will be reflected in every upcoming invoice, past invoices are not affected
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {selectedOrganization?.managed_by !== undefined &&
        selectedOrganization?.managed_by !== 'supabase' ? (
          <PartnerManagedResource
            partner={selectedOrganization?.managed_by}
            resource="Billing Addresses"
            cta={{
              installationId: selectedOrganization?.partner_id,
            }}
          />
        ) : !canReadBillingAddress ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <>
            {isLoading && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isError && (
              <AlertError
                subject="Failed to retrieve organization customer profile"
                error={error as any}
              />
            )}

            {isSuccess && (
              <BillingAddressForm address={data?.address} disabled={!canUpdateBillingAddress} />
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingAddress
