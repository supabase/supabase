import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_ as Form,
  Label_Shadcn_ as Label,
} from 'ui'
import { BillingCustomerDataForm } from './BillingCustomerDataForm'
import { TAX_IDS } from './TaxID.constants'
import { useBillingCustomerDataForm } from './useBillingCustomerDataForm'

export const BillingCustomerDataExistingOrgDialog = () => {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { slug } = useSelectedOrganization() ?? {}

  const canReadBillingCustomerData = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )

  const canUpdateBillingCustomerData = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const {
    data: customerProfile,
    error,
    isLoading,
    isSuccess,
  } = useOrganizationCustomerProfileQuery({ slug }, { enabled: canReadBillingCustomerData })

  const {
    data: taxId,
    error: errorTaxId,
    isLoading: isLoadingTaxId,
    isSuccess: isSuccessTaxId,
  } = useOrganizationTaxIdQuery({ slug })

  const initialCustomerData = useMemo(
    () => ({
      ...customerProfile?.address,
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

  const { form, handleSubmit, handleReset, isDirty } = useBillingCustomerDataForm({
    initialCustomerData,
    onCustomerDataChange: async (data) => {
      setIsSubmitting(true)

      try {
        await updateCustomerProfile({
          slug,
          address: data.address ?? undefined,
          billing_name: data.billing_name,
        })

        await updateTaxId({ slug, taxId: data.tax_id })

        toast.success('Successfully updated billing data')

        setOpen(false)

        setIsSubmitting(false)
      } catch (error: any) {
        toast.error(`Failed updating billing data: ${error.message}`)
        setIsSubmitting(false)
      }
    },
  })

  const handleClose = () => {
    handleReset()
    setOpen(false)
  }

  const getAddressSummary = () => {
    if (!customerProfile?.address?.line1) return 'Optionally add a billing address'

    const parts = [
      customerProfile?.billing_name,
      customerProfile?.address?.line1,
      customerProfile?.address?.city,
      customerProfile?.address?.state,
      customerProfile?.address?.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  const isSubmitDisabled = !isDirty || !canUpdateBillingCustomerData || isSubmitting

  return (
    <>
      <div>
        <Label htmlFor="billing-address-btn" className="text-foreground-light block mb-0">
          Billing Address / Tax Id
        </Label>
        {!canReadBillingCustomerData ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <>
            {(isLoading || isLoadingTaxId) && (
              <div className="space-y-2">
                <ShimmeringLoader />
              </div>
            )}
            {(error || errorTaxId) && (
              <AlertError
                subject="Failed to retrieve organization customer profile"
                error={(error || errorTaxId) as any}
              />
            )}
            {isSuccess && isSuccessTaxId && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground">{getAddressSummary()}</p>
                <Button
                  id="billing-address-btn"
                  onClick={() => setOpen(true)}
                  type="text"
                  aria-label="Edit"
                  size={'tiny'}
                  className="w-8 h-8 p-0 text-foreground-light"
                  disabled={!canUpdateBillingCustomerData}
                >
                  <Pencil size={14} strokeWidth={1.5} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) setOpen(false)
          else setOpen(true)
        }}
      >
        <DialogContent size={'large'}>
          <DialogHeader>
            <DialogTitle>Billing Address &amp; Tax Id</DialogTitle>
            <DialogDescription>
              This will be reflected in every upcoming invoice, past invoices are not affected
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <BillingCustomerDataForm
                className="p-5"
                form={form}
                disabled={!canUpdateBillingCustomerData}
              />
              <DialogFooter className="justify-end">
                {!canUpdateBillingCustomerData && (
                  <span className="text-sm text-foreground-lighter">
                    You need additional permissions to manage this organization's billing address
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Button type="default" onClick={handleClose}>
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
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
