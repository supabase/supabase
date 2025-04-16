import { useState } from 'react'

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
import BillingAddressForm from './BillingAddressForm'
import { Pencil } from 'lucide-react'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import { useBillingAddressForm } from './useBillingAddressForm'

interface BillingAddressDialogProps {
  slug: string | undefined
}

const BillingAddressDialog = ({ slug }: BillingAddressDialogProps) => {
  const [open, setOpen] = useState(false)

  const canReadBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )

  const canUpdateBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const {
    data: customerProfile,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useOrganizationCustomerProfileQuery({ slug }, { enabled: canReadBillingAddress })

  const handleDialogClose = () => {
    setOpen(false)
  }

  const { form, handleSubmit, handleReset, isSubmitting, isDirty } = useBillingAddressForm({
    slug,
    initialAddress: customerProfile?.address,
    onSuccess: handleDialogClose,
  })

  const handleClose = () => {
    handleReset()
    handleDialogClose()
  }

  const getAddressSummary = () => {
    if (!customerProfile?.address?.line1) return 'Optionally add a billing address'

    const parts = [
      customerProfile?.address?.line1,
      customerProfile?.address?.city,
      customerProfile?.address?.state,
      customerProfile?.address?.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  const isSubmitDisabled = !isDirty || !canUpdateBillingAddress || isSubmitting

  return (
    <>
      <div>
        <Label htmlFor="billing-address-btn" className="text-foreground-light block mb-0">
          Billing Address
        </Label>
        {!canReadBillingAddress ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <>
            {isLoading && (
              <div className="space-y-2">
                <ShimmeringLoader />
              </div>
            )}
            {isError && (
              <AlertError
                subject="Failed to retrieve organization customer profile"
                error={error as any}
              />
            )}
            {isSuccess && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">{getAddressSummary()}</p>
                <Button
                  id="billing-address-btn"
                  onClick={() => setOpen(true)}
                  type="text"
                  aria-label="Edit"
                  size={'tiny'}
                  className="w-8 h-8 p-0 text-foreground-light"
                  disabled={!canUpdateBillingAddress}
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
            <DialogTitle>Billing Address</DialogTitle>
            <DialogDescription>
              This will be reflected in every upcoming invoice, past invoices are not affected
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <BillingAddressForm className="p-5" form={form} disabled={!canUpdateBillingAddress} />
              <DialogFooter className="justify-end">
                {!canUpdateBillingAddress && (
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

export default BillingAddressDialog
