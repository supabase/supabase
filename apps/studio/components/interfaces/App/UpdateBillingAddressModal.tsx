import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag } from 'common'
import {
  BillingCustomerDataForm,
  type BillingCustomerDataFormValues,
} from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/BillingCustomerDataForm'
import { TAX_IDS } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.constants'
import { useBillingCustomerDataForm } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form_Shadcn_ as Form,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function UpdateBillingAddressModal() {
  const queryClient = useQueryClient()

  const [dismissed, setDismissed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showMissingAddressModal = useFlag('enableBillingAddressModal')
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const { can: canBillingWrite, isSuccess: permissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const shouldShow = Boolean(
    IS_PLATFORM &&
      showMissingAddressModal &&
      org &&
      org.plan.id !== 'free' &&
      org.organization_missing_address &&
      !org.billing_partner &&
      permissionsLoaded &&
      canBillingWrite
  )

  const {
    data: customerProfile,
    isSuccess: profileLoaded,
    isError: profileError,
  } = useOrganizationCustomerProfileQuery({ slug }, { enabled: shouldShow && !dismissed && !!slug })

  const {
    data: taxId,
    isSuccess: taxIdLoaded,
    isError: taxIdError,
  } = useOrganizationTaxIdQuery({ slug }, { enabled: shouldShow && !dismissed && !!slug })

  const open = shouldShow && !dismissed && !profileError && !taxIdError

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

  const { form, handleSubmit, isDirty } = useBillingCustomerDataForm({
    initialCustomerData,
    onCustomerDataChange: async (data) => {
      if (!slug) return
      setIsSubmitting(true)

      try {
        await updateCustomerProfile({
          slug,
          address: data.address,
          billing_name: data.billing_name,
        })

        await updateTaxId({ slug, taxId: data.tax_id })

        await invalidateOrganizationsQuery(queryClient)

        toast.success('Successfully updated billing address')
        setDismissed(true)
      } catch (error: any) {
        toast.error(`Failed to update billing address: ${error.message}`)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setDismissed(true)
      }}
    >
      <DialogContent
        size="medium"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Billing address required</DialogTitle>
          <DialogDescription>
            Please provide a billing address for your organization. If you are a registered business
            and have a Tax ID, please add your Tax ID too.
          </DialogDescription>
        </DialogHeader>

        {!profileLoaded || !taxIdLoaded ? (
          <DialogSection>
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          </DialogSection>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogSection className="max-h-[60vh] overflow-y-auto">
                <BillingCustomerDataForm form={form} />
              </DialogSection>
              <DialogFooter>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={!isDirty || isSubmitting}
                >
                  Save address
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
