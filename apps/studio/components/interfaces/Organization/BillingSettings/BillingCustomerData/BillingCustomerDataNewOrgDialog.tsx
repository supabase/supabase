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
import BillingCustomerDataForm from './BillingCustomerDataForm'
import { Pencil } from 'lucide-react'

import { useBillingCustomerDataForm } from './useBillingCustomerDataForm'

interface BillingCustomerDataNewOrgDialogProps {
  onBillingAddressChanged: (data: any) => void
  onTaxIdChanged: (data: any) => void
}

const BillingCustomerDataNewOrgDialog = ({
  onBillingAddressChanged,
  onTaxIdChanged,
}: BillingCustomerDataNewOrgDialogProps) => {
  const [open, setOpen] = useState(false)

  const handleDialogClose = () => {
    setOpen(false)
  }

  const { form, handleSubmit, handleReset, isSubmitting, isDirty } = useBillingCustomerDataForm({
    onSuccess: handleDialogClose,
    updateCustomerProfile: onBillingAddressChanged,
    updateTaxId: onTaxIdChanged,
  })

  const handleClose = () => {
    handleReset()
    handleDialogClose()
  }

  const getAddressSummary = () => {
    const { line1, city, state, country } = form.getValues()

    if (!line1) return 'Optionally add a billing address'

    const parts = [line1, city, state, country].filter(Boolean)

    return parts.join(', ')
  }

  const isSubmitDisabled = !isDirty || isSubmitting

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground-light" htmlFor="billing-address-btn">
            {getAddressSummary()}
          </label>
          <Button
            id="billing-address-btn"
            onClick={() => setOpen(true)}
            type="text"
            aria-label="Edit"
            size={'tiny'}
            className="w-8 h-8 p-0 text-foreground-light"
          >
            <Pencil size={14} strokeWidth={1.5} />
          </Button>
        </div>
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
              <BillingCustomerDataForm className="p-5" form={form} />
              <DialogFooter className="justify-end">
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

export default BillingCustomerDataNewOrgDialog
