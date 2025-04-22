import { useMemo, useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DialogFooter,
  Form_Shadcn_ as Form,
} from 'ui'
import { Label_Shadcn_ as Label } from 'ui'
import { Pencil } from 'lucide-react'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import { useBillingCustomerDataForm } from './useBillingCustomerDataForm'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { TAX_IDS } from './TaxID.constants'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { BillingCustomerDataForm } from './BillingCustomerDataForm'
import { toast } from 'sonner'

interface BillingCustomerDataExistingOrgDialogProps {
  slug: string | undefined
}

const BillingCustomerDataExistingOrgDialog = ({
  slug,
}: BillingCustomerDataExistingOrgDialogProps) => {
  const [open, setOpen] = useState(false)

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

  const handleDialogClose = () => {
    setOpen(false)
  }

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

  const { mutate: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation()
  const { mutate: updateTaxId } = useOrganizationTaxIdUpdateMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)

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

        handleDialogClose()

        setIsSubmitting(false)
      } catch (error: any) {
        toast.error(`Failed updating billing data: ${error.message}`)
        setIsSubmitting(false)
      }
    },
  })

  const handleClose = () => {
    handleReset()
    handleDialogClose()
  }

  const getAddressSummary = () => {
    if (!customerProfile?.address?.line1 && !customerProfile?.billing_name)
      return 'Optionally add a billing address'

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
          if (!value) handleDialogClose()
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

export default BillingCustomerDataExistingOrgDialog
