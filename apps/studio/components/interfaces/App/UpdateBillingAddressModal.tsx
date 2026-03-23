import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag } from 'common'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getAddressElementAppearanceOptions, STRIPE_ELEMENT_FONTS } from 'components/interfaces/Billing/Payment/Payment.utils'
import {
  BillingCustomerDataForm,
} from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/BillingCustomerDataForm'
import { useBillingCustomerDataForm } from 'components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, STRIPE_PUBLIC_KEY } from 'lib/constants'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form_Shadcn_ as Form,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

export function UpdateBillingAddressModal() {
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()

  const [dismissed, setDismissed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showMissingAddressModal = useFlag('enableBillingAddressModal')
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const { can: canBillingWrite, isSuccess: permissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const shouldShow = Boolean(
    IS_PLATFORM &&
    showMissingAddressModal &&
    org &&
    org.plan.id !== 'free' &&
    org.organization_missing_address &&
    !org.billing_partner &&
    permissionsLoaded &&
    canBillingWrite
  )

  const {
    data: customerProfile,
    isSuccess: profileLoaded,
    isError: profileError,
  } = useOrganizationCustomerProfileQuery({ slug }, { enabled: shouldShow && !dismissed && !!slug })

  const {
    data: taxId,
    isSuccess: taxIdLoaded,
    isError: taxIdError,
  } = useOrganizationTaxIdQuery({ slug }, { enabled: shouldShow && !dismissed && !!slug })

  const open = shouldShow && !dismissed && !profileError && !taxIdError

  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation()
  const { mutateAsync: updateTaxId } = useOrganizationTaxIdUpdateMutation()

  const { form, handleSubmit, isDirty, resetKey, onAddressChange, addressCountry, addressOptions } =
    useBillingCustomerDataForm({
      customerProfile,
      taxId,
      onCustomerDataChange: async (data) => {
        if (!slug) return
        setIsSubmitting(true)

        try {
          await updateCustomerProfile({
            slug,
            address: data.address,
            billing_name: data.billing_name,
          })

          await updateTaxId({ slug, taxId: data.tax_id })

          await invalidateOrganizationsQuery(queryClient)

          toast.success('Successfully updated billing address')
          setDismissed(true)
        } catch (error: any) {
          toast.error(`Failed to update billing address: ${error.message}`)
        } finally {
          setIsSubmitting(false)
        }
      },
    })

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = await handleSubmit()
    if (validationError) {
      toast.error(validationError)
    }
  }

  const stripeElementsOptions: StripeElementsOptions = useMemo(
    () =>
      ({
        mode: 'setup',
        currency: 'usd',
        appearance: getAddressElementAppearanceOptions(resolvedTheme),
        fonts: STRIPE_ELEMENT_FONTS,
      }) as any,
    [resolvedTheme]
  )


  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setDismissed(true)
      }}
    >
      <DialogContent
        size="medium"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Billing address required</DialogTitle>
          <DialogDescription>
            Please provide a billing address for your organization. If you are a registered business
            and have a Tax ID, please add your Tax ID too.
          </DialogDescription>
        </DialogHeader>

        {!profileLoaded || !taxIdLoaded ? (
          <DialogSection>
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          </DialogSection>
        ) : (
          <Elements stripe={stripePromise} options={stripeElementsOptions}>
            <Form {...form}>
              <form onSubmit={onFormSubmit}>
                <DialogSection className="max-h-[60vh] overflow-y-auto">
                  <BillingCustomerDataForm
                    form={form}
                    addressOptions={addressOptions}
                    resetKey={resetKey}
                    onAddressChange={onAddressChange}
                    addressCountry={addressCountry}
                  />
                </DialogSection>
                <DialogFooter>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={!isDirty || isSubmitting}
                  >
                    Save address
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
