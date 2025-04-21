import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DialogFooter,
  Form_Shadcn_ as Form,
} from 'ui'
import { Pencil } from 'lucide-react'

import { FormCustomerData, useBillingCustomerDataForm } from './useBillingCustomerDataForm'
import { BillingCustomerDataForm } from './BillingCustomerDataForm'

interface BillingCustomerDataNewOrgDialogProps {
  onCustomerDataChange: (data: FormCustomerData) => void
}

const BillingCustomerDataNewOrgDialog = ({
  onCustomerDataChange,
}: BillingCustomerDataNewOrgDialogProps) => {
  const [open, setOpen] = useState(false)

  const handleDialogClose = () => {
    setOpen(false)
  }

  const { form, handleSubmit, handleReset, isDirty } = useBillingCustomerDataForm({
    onCustomerDataChange,
  })

  const handleClose = () => {
    handleReset()
    handleDialogClose()
  }

  const getAddressSummary = () => {
    const { line1, city, state, country, billing_name } = form.getValues()

    if (!line1 && !billing_name) return 'Optionally add a billing address'

    const parts = [billing_name, line1, city, state, country].filter(Boolean)

    return parts.join(', ')
  }

  const isSubmitDisabled = !isDirty

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
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form
              id="new-org-billing-data-form"
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit(handleSubmit)(e)
                if (form.formState.isValid) {
                  handleDialogClose()
                }
              }}
            >
              <BillingCustomerDataForm className="p-5" form={form} />
              <DialogFooter className="justify-end">
                <div className="flex items-center gap-2">
                  <Button type="default" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" disabled={isSubmitDisabled}>
                    Continue
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
