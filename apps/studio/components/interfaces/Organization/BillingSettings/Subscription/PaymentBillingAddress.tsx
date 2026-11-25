import { Elements } from '@stripe/react-stripe-js'
import {
  loadStripe,
  type StripeAddressElement,
  type StripeElementsOptions,
} from '@stripe/stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
} from 'ui'

import { formatBillingAddress, formatTaxId } from './PlanUpdatePayment.utils'
import {
  getAddressElementAppearanceOptions,
  STRIPE_ELEMENT_FONTS,
} from '@/components/interfaces/Billing/Payment/Payment.utils'
import { BillingCustomerDataForm } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/BillingCustomerDataForm'
import {
  useBillingCustomerDataForm,
  type BillingAddressPayload,
} from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import { organizationKeys } from '@/data/organizations/keys'
import type { OrganizationCustomerProfileData } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import type { OrganizationTaxIdData } from '@/data/organizations/organization-tax-id-query'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { STRIPE_PUBLIC_KEY } from '@/lib/constants'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

interface BillingAddressEditFormProps {
  address: CustomerAddress
  billingName: string | undefined
  taxId: CustomerTaxId | null | undefined
  /** The form starts from an edit that failed to save, so there is something to retry. */
  isRetry: boolean
  onSave: (data: BillingAddressPayload) => Promise<void>
  onCancel: () => void
}

/** Mounted only while the dialog is open, so every edit starts from the saved address. */
const BillingAddressEditForm = ({
  address,
  billingName,
  taxId,
  isRetry,
  onSave,
  onCancel,
}: BillingAddressEditFormProps) => {
  const { resolvedTheme } = useTheme()
  const addressElementRef = useRef<StripeAddressElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // The form hook resets itself whenever this object changes, so a fresh literal on every
  // render would reset it on every render.
  const customerProfile = useMemo(
    () => ({ address, billing_name: billingName }),
    [address, billingName]
  )

  const {
    form,
    handleSubmit,
    isDirty,
    resetKey,
    onAddressChange,
    applyAddressElementValue,
    addressCountry,
    addressOptions,
  } = useBillingCustomerDataForm({
    customerProfile,
    taxId,
    onCustomerDataChange: onSave,
  })

  const stripeElementsOptions: StripeElementsOptions = useMemo(
    () =>
      ({
        mode: 'setup',
        currency: 'usd',
        appearance: getAddressElementAppearanceOptions(resolvedTheme),
        fonts: STRIPE_ELEMENT_FONTS,
      }) as StripeElementsOptions,
    [resolvedTheme]
  )

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsSaving(true)

    try {
      if (addressElementRef.current) {
        applyAddressElementValue(await addressElementRef.current.getValue())
      }

      const result = await handleSubmit()
      if (result.status === 'error') toast.error(result.message)
    } catch {
      // A failed save is reported by `onSave`.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Elements stripe={stripePromise} options={stripeElementsOptions}>
      <Form {...form}>
        <form onSubmit={handleFormSubmit}>
          <DialogSection padding="small" className="overflow-visible">
            <BillingCustomerDataForm
              form={form}
              disabled={isSaving}
              addressOptions={addressOptions}
              resetKey={resetKey}
              onAddressChange={onAddressChange}
              onAddressReady={(element) => {
                addressElementRef.current = element
              }}
              addressCountry={addressCountry}
            />
          </DialogSection>
          <DialogFooter padding="small">
            <Button variant="default" disabled={isSaving} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSaving}
              disabled={!isDirty && !isRetry}
            >
              Save address
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </Elements>
  )
}

type BillingChange = Pick<BillingAddressPayload, 'address' | 'tax_id'>

interface PaymentBillingAddressProps {
  address: CustomerAddress
  billingName: string | undefined
  taxId: CustomerTaxId | null | undefined
  /**
   * An unresolved tax ID is not an absent one: saving an address edit while it is unknown
   * would submit `tax_id: null` and wipe the real one, so editing waits for it.
   */
  isTaxIdLoading?: boolean
  isTaxIdError?: boolean
  onRetryTaxId?: () => void
  disabled?: boolean
  /**
   * The address and tax ID the plan preview should price against: the edit as soon as it
   * is made, and the previous ones again if saving it fails.
   */
  onChange?: (billing: BillingChange) => void
}

/**
 * The address the plan change is billed to, with an edit dialog that saves it to the
 * organization's customer profile.
 *
 * An edit shows up straight away: the query cache is updated before the request goes out
 * and the dialog closes, instead of waiting a second or two on the API. If the request
 * fails the cache is put back and the dialog reopens with what was entered.
 */
export const PaymentBillingAddress = ({
  address,
  billingName,
  taxId,
  isTaxIdLoading = false,
  isTaxIdError = false,
  onRetryTaxId,
  disabled,
  onChange,
}: PaymentBillingAddressProps) => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [failedEdit, setFailedEdit] = useState<BillingAddressPayload | null>(null)

  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation({
    onError: () => {},
  })

  const saveBillingAddress = async (data: BillingAddressPayload) => {
    const profileKey = organizationKeys.customerProfile(slug)
    const taxIdKey = organizationKeys.taxId(slug)

    // A refetch already in flight would land with the old address and overwrite the edit.
    await Promise.all([
      queryClient.cancelQueries({ queryKey: profileKey }),
      queryClient.cancelQueries({ queryKey: taxIdKey }),
    ])
    const previousProfile = queryClient.getQueryData<OrganizationCustomerProfileData>(profileKey)
    const previousTaxId = queryClient.getQueryData<OrganizationTaxIdData>(taxIdKey)

    queryClient.setQueryData<OrganizationCustomerProfileData>(profileKey, (previous) =>
      previous
        ? {
            ...previous,
            address: data.address ?? previous.address,
            billing_name: data.billing_name,
          }
        : previous
    )
    queryClient.setQueryData<OrganizationTaxIdData>(taxIdKey, data.tax_id)

    setFailedEdit(null)
    setIsEditing(false)
    onChange?.({ address: data.address, tax_id: data.tax_id })

    try {
      await updateCustomerProfile({
        slug,
        address: data.address,
        billing_name: data.billing_name,
        tax_id: data.tax_id,
      })

      // The organization list carries the flags that nag about a missing address or tax ID.
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
    } catch (error) {
      queryClient.setQueryData(profileKey, previousProfile)
      queryClient.setQueryData(taxIdKey, previousTaxId)
      onChange?.({ address: previousProfile?.address ?? undefined, tax_id: previousTaxId ?? null })

      toast.error(
        `Failed updating billing address: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      setFailedEdit(data)
      setIsEditing(true)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 rounded-md border bg-surface-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground-light">Billing address</p>
          {billingName && (
            <p className="mt-1 text-base text-foreground" translate="no">
              {billingName}
            </p>
          )}
          <p className="text-base text-foreground" translate="no">
            {formatBillingAddress(address)}
          </p>
          {taxId && (
            <p className="mt-1 text-base text-foreground">
              <span translate="no">{formatTaxId(taxId, address.country)}</span>
            </p>
          )}
        </div>
        {isTaxIdError ? (
          <Button
            variant="text"
            className="shrink-0 px-0 text-foreground-light underline hover:text-foreground"
            disabled={disabled}
            onClick={onRetryTaxId}
          >
            Retry loading tax ID
          </Button>
        ) : (
          <Button
            variant="text"
            className="shrink-0 px-0 text-foreground-light underline hover:text-foreground"
            disabled={disabled || isTaxIdLoading}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <Dialog
        open={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open)
          if (!open) setFailedEdit(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Edit billing address</DialogTitle>
            <DialogDescription>
              Applies to this payment and every upcoming invoice. Past invoices are not affected.
            </DialogDescription>
          </DialogHeader>
          <BillingAddressEditForm
            address={failedEdit?.address ?? address}
            billingName={failedEdit?.billing_name ?? billingName}
            taxId={failedEdit ? failedEdit.tax_id : taxId}
            isRetry={failedEdit !== null}
            onSave={saveBillingAddress}
            onCancel={() => {
              setIsEditing(false)
              setFailedEdit(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
