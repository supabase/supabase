import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { organizationKeys } from 'data/organizations/keys'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button, Card, CardFooter, Form_Shadcn_ as Form } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import {
  BillingCustomerDataForm,
  type BillingCustomerDataFormValues,
} from './BillingCustomerDataForm'
import { TAX_IDS } from './TaxID.constants'
import { useBillingCustomerDataForm } from './useBillingCustomerDataForm'

export const BillingCustomerData = () => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { can: canReadBillingCustomerData, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.BILLING_READ, 'stripe.customer')
  const { can: canUpdateBillingCustomerData } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const {
    data: customerProfile,
    error,
    isPending: isLoading,
    isSuccess,
  } = useOrganizationCustomerProfileQuery({ slug }, { enabled: canReadBillingCustomerData })

  const {
    data: taxId,
    error: errorLoadingTaxId,
    isPending: isLoadingTaxId,
    isSuccess: loadedTaxId,
  } = useOrganizationTaxIdQuery({ slug })

  const initialCustomerData = useMemo<Partial<BillingCustomerDataFormValues>>(
    () => ({
      city: customerProfile?.address?.city ?? undefined,
      country: customerProfile?.address?.country,
      line1: customerProfile?.address?.line1,
      line2: customerProfile?.address?.line2 ?? undefined,
      postal_code: customerProfile?.address?.postal_code ?? undefined,
      state: customerProfile?.address?.state ?? undefined,
      billing_name: customerProfile?.billing_name,
      tax_id_type: taxId?.type,
      tax_id_value: taxId?.value,
      tax_id_name: taxId
        ? TAX_IDS.find(
            (option) => option.type === taxId.type && option.countryIso2 === taxId.country
          )?.name || ''
        : '',
    }),
    [customerProfile, taxId]
  )

  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation()
  const { mutateAsync: updateTaxId } = useOrganizationTaxIdUpdateMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { form, handleSubmit, handleReset, isDirty } = useBillingCustomerDataForm({
    initialCustomerData,
    onCustomerDataChange: async (data) => {
      setIsSubmitting(true)

      try {
        await updateCustomerProfile({
          slug,
          address: data.address,
          billing_name: data.billing_name,
        })

        await updateTaxId({ slug, taxId: data.tax_id })

        toast.success('Successfully updated billing data')

        // Optimistically update organization_missing_tax_id in the cached organizations list
        // so the TaxIdBanner hides immediately. The server responds 304 Not Modified for a
        // while after the tax ID is saved, so invalidation/refetch won't work here.
        queryClient.setQueriesData<any[]>(
          { queryKey: organizationKeys.list(), exact: true },
          (prev) => {
            if (!prev) return prev
            return prev.map((org) =>
              org.slug === slug ? { ...org, organization_missing_tax_id: data.tax_id == null } : org
            )
          }
        )

        setIsSubmitting(false)
      } catch (error) {
        toast.error(
          `Failed updating billing data: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        setIsSubmitting(false)
      }
    },
  })

  const isSubmitDisabled = !isDirty || !canUpdateBillingCustomerData || isSubmitting

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-3">
          <p className="text-foreground text-base m-0">Billing Address &amp; Tax ID</p>
          <p className="text-sm text-foreground-light m-0">
            Changes will be reflected in every upcoming invoice, past invoices are not affected
          </p>
          <p className="text-sm text-foreground-light m-0">
            A Tax ID is only required for registered businesses.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {selectedOrganization?.managed_by !== undefined &&
        selectedOrganization?.managed_by !== 'supabase' ? (
          <PartnerManagedResource
            managedBy={selectedOrganization?.managed_by}
            resource="Billing Addresses"
            cta={{
              installationId: selectedOrganization?.partner_id,
            }}
          />
        ) : isPermissionsLoaded && !canReadBillingCustomerData ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <>
            {(isLoading || isLoadingTaxId) && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {(error || errorLoadingTaxId) && (
              <AlertError
                subject="Failed to retrieve organization customer profile"
                error={(error || errorLoadingTaxId) as any}
              />
            )}

            {isSuccess && loadedTaxId && (
              <Card>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <BillingCustomerDataForm
                      className="p-8"
                      form={form}
                      disabled={!canUpdateBillingCustomerData}
                    />
                    <CardFooter className="border-t justify-end px-8">
                      {!canUpdateBillingCustomerData && (
                        <span className="text-sm text-foreground-lighter mr-auto">
                          You need additional permissions to manage this organization's billing
                          address
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Button type="default" onClick={handleReset} disabled={isSubmitDisabled}>
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          disabled={isSubmitDisabled}
                          loading={isSubmitting}
                        >
                          Save
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
