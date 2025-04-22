import { Pencil } from 'lucide-react'
import { useRef, useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_ as Form,
} from 'ui'
import { BillingCustomerDataForm } from './BillingCustomerDataForm'
import { FormCustomerData, useBillingCustomerDataForm } from './useBillingCustomerDataForm'

interface BillingCustomerDataNewOrgDialogProps {
  onCustomerDataChange: (data: FormCustomerData) => void
}

const BillingCustomerDataNewOrgDialog = ({
  onCustomerDataChange,
}: BillingCustomerDataNewOrgDialogProps) => {
  const focusInputRef = useRef<number>(0)
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
    <div className="flex items-center justify-between">
      <label className="text-sm text-foreground-light" htmlFor="billing-address-btn">
        {getAddressSummary()}
      </label>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) handleDialogClose()
          else setOpen(true)
        }}
      >
        <DialogTrigger asChild>
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
        </DialogTrigger>
        <DialogContent
          size="large"
          onFocus={(e) => {
            // [Joshen] There's something odd going on with using Dialog and RHF FormField here
            // where the focus keeps going to the Dialog when tabbing across the input fields
            // This is just an attempt to manually refocus amongst the input and is imperfect so
            // feel free to remove if we feel like this is making it worse
            // FWIW it's likely happening across the dashboard whereever we're using Dialog and FormField
            const formInputs = e.target.querySelector('form')?.querySelectorAll('input')
            if (e.target.role === 'dialog') {
              const formatted = Array.from(formInputs as any).map((x: any) => x.name)
              const currentFocus = formatted.findIndex((x) => x === focusInputRef.current)
              if (currentFocus >= 0) {
                const nextFocus = currentFocus + 1
                if (nextFocus >= formatted.length) formInputs?.[0].focus()
                else formInputs?.[nextFocus].focus()
              }
            } else {
              focusInputRef.current = (e.target as any).name
            }
          }}
        >
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
    </div>
  )
}

export default BillingCustomerDataNewOrgDialog
