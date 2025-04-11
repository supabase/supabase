import { useState } from 'react'
import { Button, Dialog, DialogContent } from 'ui'
import { Label_Shadcn_ as Label } from 'ui'
import BillingAddressForm from './BillingAddressForm'
import { Pencil } from 'lucide-react'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'

interface BillingAddressDialogProps {
  slug: string
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

  const onClose = () => {
    setOpen(false)
  }

  // Create a summary of the address if it exists
  const getAddressSummary = () => {
    if (!customerProfile?.address?.line1) return 'Add billing address'

    const parts = [
      customerProfile?.address?.line1,
      customerProfile?.address?.city,
      customerProfile?.address?.state,
      customerProfile?.address?.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  return (
    <>
      <div>
        <Label htmlFor="billing-address-btn" className="text-foreground-light block mb-3">
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
              <Button
                id="billing-address-btn"
                type="default"
                size="small"
                onClick={() => setOpen(true)}
                disabled={!canReadBillingAddress || !canUpdateBillingAddress}
                iconRight={<Pencil size={16} strokeWidth={1.5} className="text-foreground-muted" />}
                className="w-full justify-between"
              >
                {getAddressSummary()}
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) onClose()
          else setOpen(true)
        }}
      >
        <DialogContent size={'large'} className="border-none">
          <BillingAddressForm
            address={customerProfile?.address}
            onClose={onClose}
            insideDialog
            disabled={!canUpdateBillingAddress}
            formId="billing-address-form-dialog"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BillingAddressDialog
