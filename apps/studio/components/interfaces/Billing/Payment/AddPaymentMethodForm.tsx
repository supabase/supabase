import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Label_Shadcn_, Modal } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from '@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import { organizationKeys } from '@/data/organizations/keys'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationPaymentMethodMarkAsDefaultMutation } from '@/data/organizations/organization-payment-method-default-mutation'
import { useOrganizationTaxIdQuery } from '@/data/organizations/organization-tax-id-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface AddPaymentMethodFormProps {
  returnUrl: string
  onCancel: () => void
  onConfirm: () => void
}

// Stripe docs recommend to use the new SetupIntent flow over
// manually creating and attaching payment methods via the API
// Small UX annoyance here, that the page will be refreshed

const AddPaymentMethodForm = ({ onCancel, onConfirm }: AddPaymentMethodFormProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { data: customerProfile, isPending: customerProfileLoading } =
    useOrganizationCustomerProfileQuery({
      slug: selectedOrganization?.slug,
    })

  const [isSaving, setIsSaving] = useState(false)
  const [isDefaultPaymentMethod, setIsDefaultPaymentMethod] = useState(true)
  const [isPrimaryBillingAddress, setIsPrimaryBillingAddress] = useState(true)

  const queryClient = useQueryClient()
  const { mutateAsync: markAsDefault } = useOrganizationPaymentMethodMarkAsDefaultMutation()
  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation({
    onError: () => {},
  })
  const {
    data: taxId,
    isPending: isCustomerTaxIdLoading,
    isError: isTaxIdError,
  } = useOrganizationTaxIdQuery({
    slug: selectedOrganization?.slug,
  })

  const paymentRef = useRef<PaymentMethodElementRef | null>(null)

  const handleSubmit = async (event: any) => {
    event.preventDefault()

    setIsSaving(true)

    if (document !== undefined) {
      // [Joshen] This is to ensure that any 3DS popup from Stripe remains clickable
      document.body.classList.add('pointer-events-auto!')
    }

    if (isPrimaryBillingAddress && isTaxIdError) {
      toast.error('Unable to load current tax ID. Please try again.')
      setIsSaving(false)
      if (document !== undefined) {
        document.body.classList.remove('pointer-events-auto!')
      }
      return
    }

    // Validate address/tax ID with a dry run before proceeding with Stripe,
    // so validation errors (e.g. invalid tax ID) block the flow early.
    const formValues = isPrimaryBillingAddress
      ? await paymentRef.current?.getFormValues()
      : undefined

    if (isPrimaryBillingAddress && !formValues) {
      setIsSaving(false)
      if (document !== undefined) {
        document.body.classList.remove('pointer-events-auto!')
      }
      return
    }

    if (isPrimaryBillingAddress && formValues) {
      try {
        await updateCustomerProfile({
          slug: selectedOrganization?.slug,
          address: formValues.address,
          billing_name: formValues.customerName,
          tax_id: formValues.taxId,
          dry_run: true,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to validate billing profile')
        setIsSaving(false)
        if (document !== undefined) {
          document.body.classList.remove('pointer-events-auto!')
        }
        return
      }
    }

    // Dry run passed — proceed with Stripe payment method creation / 3DS
    const result = await paymentRef.current?.confirmSetup()

    if (!result) {
      setIsSaving(false)
    } else {
      // Stripe succeeded — persist the customer profile update for real
      if (isPrimaryBillingAddress && formValues) {
        try {
          await updateCustomerProfile({
            slug: selectedOrganization?.slug,
            address: formValues.address,
            billing_name: formValues.customerName,
            tax_id: formValues.taxId,
          })
        } catch {
          toast.error(
            'Your payment method was added successfully, but we could not save your billing address. Please update it in your organization settings.'
          )
        }
      }

      if (
        isDefaultPaymentMethod &&
        selectedOrganization &&
        typeof result.setupIntent?.payment_method === 'string'
      ) {
        try {
          await markAsDefault({
            slug: selectedOrganization.slug,
            paymentMethodId: result.setupIntent.payment_method,
          })

          await queryClient.invalidateQueries({
            queryKey: organizationKeys.paymentMethods(selectedOrganization.slug),
          })

          queryClient.setQueriesData(
            { queryKey: organizationKeys.paymentMethods(selectedOrganization.slug) },
            (prev: any) => {
              if (!prev) return prev
              return {
                ...prev,
                defaultPaymentMethodId: result.setupIntent.payment_method,
                data: prev.data.map((pm: any) => ({
                  ...pm,
                  is_default: pm.id === result.setupIntent.payment_method,
                })),
              }
            }
          )
        } catch (error) {
          toast.error('Failed to set payment method as default')
        }
      } else {
        if (selectedOrganization) {
          await queryClient.invalidateQueries({
            queryKey: organizationKeys.paymentMethods(selectedOrganization.slug),
          })
        }
      }

      setIsSaving(false)
      onConfirm()
    }

    if (document !== undefined) {
      document.body.classList.remove('pointer-events-auto!')
    }
  }

  if (customerProfileLoading || isCustomerTaxIdLoading) {
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
        <NewPaymentMethodElement
          readOnly={isSaving}
          email={selectedOrganization?.billing_email}
          currentAddress={customerProfile?.address}
          customerName={customerProfile?.billing_name}
          currentTaxId={taxId}
          ref={paymentRef}
        />

        <div className="flex items-center gap-x-2 mt-4 mb-2">
          <Checkbox
            id="save-as-default"
            checked={isDefaultPaymentMethod}
            onCheckedChange={(checked) => {
              if (typeof checked === 'boolean') {
                setIsDefaultPaymentMethod(checked)
              }
            }}
          />
          <Label_Shadcn_ htmlFor="save-as-default" className="text-foreground-light">
            Save as default payment method
          </Label_Shadcn_>
        </div>

        <div className="flex items-center gap-x-2 mt-4 mb-2">
          <Checkbox
            id="is-primary-billing-address"
            checked={isPrimaryBillingAddress}
            onCheckedChange={(checked) => {
              if (typeof checked === 'boolean') {
                setIsPrimaryBillingAddress(checked)
              }
            }}
          />
          <Label_Shadcn_ htmlFor="is-primary-billing-address" className="text-foreground-light">
            Use the billing address as my organization's primary address
          </Label_Shadcn_>
        </div>
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
