import { AddressElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { useBillingCustomerDataForm } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import { organizationKeys } from 'data/organizations/keys'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationPaymentMethodMarkAsDefaultMutation } from 'data/organizations/organization-payment-method-default-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { isEqual } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox_Shadcn_, Label_Shadcn_, LoadingLine, Modal } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

interface AddPaymentMethodFormProps {
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
  showSetDefaultCheckbox?: boolean
  autoMarkAsDefaultPaymentMethod?: boolean
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm = ({
  returnUrl,
  onCancel,
  onConfirm,
  showSetDefaultCheckbox = false,
  autoMarkAsDefaultPaymentMethod = false,
}: AddPaymentMethodFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const selectedOrganization = useSelectedOrganization()

  const { data: customerProfile, isLoading: customerProfileLoading } =
    useOrganizationCustomerProfileQuery({
      slug: selectedOrganization?.slug,
    })

  const [isSaving, setIsSaving] = useState(false)
  const [isDefault, setIsDefault] = useState(showSetDefaultCheckbox)
  const [isPrimaryBillingAddress, setIsPrimaryBillingAddress] = useState(true)

  const queryClient = useQueryClient()
  const { mutateAsync: markAsDefault } = useOrganizationPaymentMethodMarkAsDefaultMutation()
  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation()

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
      if (
        (isDefault || autoMarkAsDefaultPaymentMethod) &&
        selectedOrganization &&
        typeof setupIntent?.payment_method === 'string'
      ) {
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

        try {
          if (isPrimaryBillingAddress) {
            const addressValue = await elements
              .getElement('address')
              ?.getValue()
              .then((it) => it.value)

            if (addressValue && !isEqual(addressValue.address, customerProfile?.address)) {
              await updateCustomerProfile({
                billing_name: addressValue.name,
                address: {
                  ...addressValue.address,
                  line2: addressValue.address.line2 ?? undefined,
                },
              })
            }
          }
        } catch (error) {
          toast.error('Failed to update billing address')
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

  if (customerProfileLoading) {
    return (
      <Modal.Content>
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
          <ShimmeringLoader />
          <ShimmeringLoader />
          <ShimmeringLoader />
        </div>
      </Modal.Content>
    )
  }

  return (
    <div>
      <Modal.Content
        className={`transition ${isSaving ? 'pointer-events-none opacity-75' : 'opacity-100'}`}
      >
        <PaymentElement
          options={{
            defaultValues: {
              billingDetails: {
                email: selectedOrganization?.billing_email ?? '',
              },
            },
          }}
        />

        <AddressElement
          className="mt-1"
          options={{
            mode: 'billing',
            defaultValues: {
              address: customerProfile?.address ?? undefined,
              name: customerProfile?.billing_name,
            },
          }}
        />

        {showSetDefaultCheckbox && (
          <>
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

            <div className="flex items-center gap-x-2 mt-4 mb-2">
              <Checkbox_Shadcn_
                id="save-as-default"
                checked={isPrimaryBillingAddress}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setIsPrimaryBillingAddress(checked)
                  }
                }}
              />
              <Label_Shadcn_ htmlFor="save-as-default" className="text-foreground-light">
                Use the billing address as my organization's primary address
              </Label_Shadcn_>
            </div>
          </>
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
          htmlType="button"
          size="small"
          type="primary"
          loading={isSaving}
          disabled={isSaving}
          onClick={handleSubmit}
        >
          Add payment method
        </Button>
      </Modal.Content>
    </div>
  )
}

export default AddPaymentMethodForm
