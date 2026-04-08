import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, StripeAddressElement, StripeElementsOptions } from '@stripe/stripe-js'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardFooter, Form_Shadcn_ as Form } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { BillingCustomerDataForm } from './BillingCustomerDataForm'
import { useBillingCustomerDataForm } from './useBillingCustomerDataForm'
import {
  getAddressElementAppearanceOptions,
  STRIPE_ELEMENT_FONTS,
} from '@/components/interfaces/Billing/Payment/Payment.utils'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import AlertError from '@/components/ui/AlertError'
import NoPermission from '@/components/ui/NoPermission'
import PartnerManagedResource from '@/components/ui/PartnerManagedResource'
import { organizationKeys } from '@/data/organizations/keys'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationTaxIdQuery } from '@/data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from '@/data/organizations/organization-tax-id-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { STRIPE_PUBLIC_KEY } from '@/lib/constants'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

export const BillingCustomerData = () => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
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

  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation({
    onError: () => {},
  })
  const { mutateAsync: updateTaxId } = useOrganizationTaxIdUpdateMutation({ onError: () => {} })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const addressElementRef = useRef<StripeAddressElement | null>(null)

  const {
    form,
    handleSubmit,
    handleReset,
    isDirty,
    resetKey,
    onAddressChange,
    applyAddressElementValue,
    markCurrentValuesAsSaved,
    addressCountry,
    addressOptions,
  } = useBillingCustomerDataForm({
    customerProfile,
    taxId,
    onCustomerDataChange: async (data) => {
      setIsSubmitting(true)

      try {
        try {
          await updateCustomerProfile({
            slug,
            address: data.address,
            billing_name: data.billing_name,
          })
        } catch (error) {
          toast.error(
            `Failed updating billing address: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          throw error
        }

        try {
          await updateTaxId({ slug, taxId: data.tax_id })
        } catch (error) {
          toast.error(
            `Failed updating tax ID: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          throw error
        }

        toast.success('Successfully updated billing data')

        queryClient.setQueriesData<any[]>(
          { queryKey: organizationKeys.list(), exact: true },
          (prev) => {
            if (!prev) return prev
            return prev.map((org) =>
              org.slug === slug ? { ...org, organization_missing_tax_id: data.tax_id == null } : org
            )
          }
        )
      } catch (error) {
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  useEffect(() => {
    addressElementRef.current = null
  }, [resetKey])

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (addressElementRef.current) {
        const addressResult = await addressElementRef.current.getValue()
        applyAddressElementValue(addressResult)
      }
      const result = await handleSubmit()
      if (result.status === 'error') {
        toast.error(result.message)
        return
      }
      markCurrentValuesAsSaved(
        result.submittedState.addressValue,
        result.submittedState.taxIdValues
      )
    } catch {
      // Save failure toasts are handled inside onCustomerDataChange.
    }
  }

  const isSubmitDisabled = !isDirty || !canUpdateBillingCustomerData || isSubmitting

  const stripeElementsOptions: StripeElementsOptions = useMemo(
    () =>
      ({
        mode: 'setup',
        currency: 'usd',
        appearance: getAddressElementAppearanceOptions(resolvedTheme),
        fonts: STRIPE_ELEMENT_FONTS,
      }) as any,
    [resolvedTheme]
  )

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
              <Elements stripe={stripePromise} options={stripeElementsOptions}>
                <Card>
                  <Form {...form}>
                    <form onSubmit={onFormSubmit}>
                      <BillingCustomerDataForm
                        className="p-8"
                        form={form}
                        disabled={!canUpdateBillingCustomerData}
                        addressOptions={addressOptions}
                        resetKey={resetKey}
                        onAddressChange={onAddressChange}
                        onAddressReady={(element) => {
                          addressElementRef.current = element
                        }}
                        addressCountry={addressCountry}
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
              </Elements>
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
