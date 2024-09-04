import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { organizationKeys } from 'data/organizations/keys'
import { useOrganizationPaymentMethodMarkAsDefaultMutation } from 'data/organizations/organization-payment-method-default-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox_Shadcn_, Label_Shadcn_, Modal } from 'ui'

interface AddPaymentMethodFormProps {
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
  showSetDefaultCheckbox?: boolean
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm = ({
  returnUrl,
  onCancel,
  onConfirm,
  showSetDefaultCheckbox = false,
}: AddPaymentMethodFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const selectedOrganization = useSelectedOrganization()

  const [isSaving, setIsSaving] = useState(false)
  const [isDefault, setIsDefault] = useState(showSetDefaultCheckbox)

  const queryClient = useQueryClient()
  const { mutateAsync: markAsDefault } = useOrganizationPaymentMethodMarkAsDefaultMutation()

  const handleSubmit = async (event: any) => {
    event.preventDefault()

    if (!stripe || !elements) {
      console.error('Stripe.js has not loaded')
      return
    }

    setIsSaving(true)

    if (document !== undefined) {
      // [Joshen] This is to ensure that any 3DS popup from Stripe remains clickable
      document.body.classList.add('!pointer-events-auto')
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: returnUrl },
    })

    if (error) {
      setIsSaving(false)
      toast.error(error?.message ?? ' Failed to save card details')
    } else {
      if (isDefault && selectedOrganization && typeof setupIntent?.payment_method === 'string') {
        try {
          await markAsDefault({
            slug: selectedOrganization.slug,
            paymentMethodId: setupIntent.payment_method,
          })

          await queryClient.invalidateQueries(
            organizationKeys.paymentMethods(selectedOrganization.slug)
          )

          queryClient.setQueriesData(
            organizationKeys.paymentMethods(selectedOrganization.slug),
            (prev: any) => {
              if (!prev) return prev
              return {
                ...prev,
                defaultPaymentMethodId: setupIntent.payment_method,
                data: prev.data.map((pm: any) => ({
                  ...pm,
                  is_default: pm.id === setupIntent.payment_method,
                })),
              }
            }
          )
        } catch (error) {
          toast.error('Failed to set payment method as default')
        }
      } else {
        if (selectedOrganization) {
          await queryClient.invalidateQueries(
            organizationKeys.paymentMethods(selectedOrganization.slug)
          )
        }
      }

      setIsSaving(false)
      onConfirm()
    }

    if (document !== undefined) {
      document.body.classList.remove('!pointer-events-auto')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Content
        className={`transition ${isSaving ? 'pointer-events-none opacity-75' : 'opacity-100'}`}
      >
        <PaymentElement className="[.p-LinkAutofillPrompt]:pt-0" />
        {showSetDefaultCheckbox && (
          <div className="flex items-center gap-x-2 mt-4 mb-2">
            <Checkbox_Shadcn_
              id="save-as-default"
              checked={isDefault}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  setIsDefault(checked)
                }
              }}
            />
            <Label_Shadcn_ htmlFor="save-as-default" className="text-foreground-light">
              Save as default payment method
            </Label_Shadcn_>
          </div>
        )}
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center space-x-2">
        <Button
          htmlType="button"
          size="small"
          type="default"
          onClick={onCancel}
          block
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          block
          htmlType="submit"
          size="small"
          type="primary"
          loading={isSaving}
          disabled={isSaving}
        >
          Add payment method
        </Button>
      </Modal.Content>
    </form>
  )
}

export default AddPaymentMethodForm
