import { zodResolver } from '@hookform/resolvers/zod'
import type {
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions,
} from '@stripe/stripe-js'
import type { CustomerAddress, CustomerTaxId } from 'data/organizations/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { TaxIdFormValues, TaxIdSchema } from './BillingCustomerDataForm'
import { TAX_IDS } from './TaxID.constants'
import { getEffectiveTaxCountry, resolveStoredTaxId, sanitizeTaxIdValue } from './TaxID.utils'

type StripeAddressValue = StripeAddressElementChangeEvent['value']
type StripeAddressValidationState = 'unknown' | 'complete' | 'incomplete'

interface UseBillingCustomerDataFormProps {
  customerProfile?: {
    address?: CustomerAddress | null
    billing_name?: string
  } | null
  taxId?: CustomerTaxId | null
  onCustomerDataChange: (data: BillingAddressPayload) => void
}

export type BillingAddressPayload = {
  address: CustomerAddress | undefined
  billing_name: string
  tax_id: CustomerTaxId | null
}

export function useBillingCustomerDataForm({
  customerProfile,
  taxId,
  onCustomerDataChange,
}: UseBillingCustomerDataFormProps) {
  // Stripe-shaped snapshot of the server address, used to seed the ref and for dirty-checking
  const initialStripeAddressValue: StripeAddressValue = useMemo(
    () => ({
      name: customerProfile?.billing_name ?? '',
      address: {
        line1: customerProfile?.address?.line1 ?? '',
        line2: customerProfile?.address?.line2 ?? '',
        city: customerProfile?.address?.city ?? '',
        state: customerProfile?.address?.state ?? '',
        postal_code: customerProfile?.address?.postal_code ?? '',
        country: customerProfile?.address?.country ?? '',
      },
    }),
    [customerProfile]
  )

  const addressOptions: StripeAddressElementOptions = useMemo(
    () => ({
      mode: 'billing',
      fields: { phone: 'never' },
      autocomplete: {
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
        mode: 'google_maps_api' as const,
      },
      display: { name: 'full' as const },
      defaultValues: initialStripeAddressValue,
    }),
    [initialStripeAddressValue]
  )

  const initialTaxIdValues = useMemo(
    () => ({
      tax_id_type: taxId?.type || '',
      tax_id_value: taxId?.value || '',
      tax_id_name: taxId
        ? (resolveStoredTaxId(taxId.type, taxId.country, customerProfile?.address?.country)?.name ??
          '')
        : '',
    }),
    [customerProfile, taxId]
  )

  const form = useForm<TaxIdFormValues>({
    resolver: zodResolver(TaxIdSchema),
    defaultValues: initialTaxIdValues,
  })

  // Reset RHF when initial tax ID data changes
  useEffect(() => {
    form.reset(initialTaxIdValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaxIdValues])

  // Stripe address state — seeded with server data so the ref is never stale
  const stripeAddressRef = useRef<StripeAddressValue>(initialStripeAddressValue)

  useEffect(() => {
    stripeAddressRef.current = initialStripeAddressValue
  }, [initialStripeAddressValue])

  const stripeAddressValidationRef = useRef<StripeAddressValidationState>('unknown')

  const [isAddressDirty, setIsAddressDirty] = useState(false)
  const [addressCountry, setAddressCountry] = useState<string | undefined>(
    initialStripeAddressValue.address.country || undefined
  )
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    setAddressCountry(initialStripeAddressValue.address.country || undefined)
  }, [initialStripeAddressValue.address.country])

  const onAddressChange = useCallback(
    (evt: StripeAddressElementChangeEvent) => {
      stripeAddressRef.current = evt.value
      stripeAddressValidationRef.current = evt.complete ? 'complete' : 'incomplete'
      setAddressCountry(evt.value.address.country || undefined)
      setIsAddressDirty(!isAddressEqual(evt.value, initialStripeAddressValue))
    },
    [initialStripeAddressValue]
  )

  const isDirty = isAddressDirty || form.formState.isDirty

  const handleSubmit = async () => {
    const address = stripeAddressRef.current

    if (!address.name?.trim()) {
      return 'Full name is required.'
    }
    if (!address.address.country?.trim()) {
      return 'Country is required.'
    }
    if (!address.address.line1?.trim()) {
      return 'Address Line 1 is required.'
    }
    if (!address.address.city?.trim()) {
      return 'City is required.'
    }
    if (!address.address.postal_code?.trim()) {
      return 'Postal code is required.'
    }
    if (isAddressDirty && stripeAddressValidationRef.current === 'incomplete') {
      return 'Please enter a valid billing address.'
    }

    const taxIdValues = form.getValues()
    const selectedTaxId = TAX_IDS.find((option) => option.name === taxIdValues.tax_id_name)

    onCustomerDataChange({
      address: {
        line1: address.address.line1,
        line2: address.address.line2 || undefined,
        city: address.address.city,
        state: address.address.state || undefined,
        postal_code: address.address.postal_code,
        country: address.address.country,
      },
      billing_name: address.name,
      tax_id:
        selectedTaxId && taxIdValues.tax_id_type?.length && taxIdValues.tax_id_value?.length
          ? {
              type: taxIdValues.tax_id_type,
              value: sanitizeTaxIdValue({
                value: taxIdValues.tax_id_value,
                name: taxIdValues.tax_id_name,
              }),
              country: getEffectiveTaxCountry(selectedTaxId),
            }
          : null,
    })

    return null // no error
  }

  const handleReset = () => {
    form.reset(initialTaxIdValues)
    stripeAddressRef.current = initialStripeAddressValue
    stripeAddressValidationRef.current = 'unknown'
    setIsAddressDirty(false)
    setAddressCountry(initialStripeAddressValue.address.country || undefined)
    setResetKey((c) => c + 1)
  }

  return {
    form,
    handleSubmit,
    handleReset,
    isDirty,
    resetKey,
    onAddressChange,
    addressCountry,
    addressOptions,
  }
}

function isAddressEqual(current: StripeAddressValue, original: StripeAddressValue): boolean {
  return (
    normalize(current.name) === normalize(original.name) &&
    normalize(current.address.line1) === normalize(original.address.line1) &&
    normalize(current.address.line2) === normalize(original.address.line2) &&
    normalize(current.address.city) === normalize(original.address.city) &&
    normalize(current.address.state) === normalize(original.address.state) &&
    normalize(current.address.postal_code) === normalize(original.address.postal_code) &&
    normalize(current.address.country) === normalize(original.address.country)
  )
}

function normalize(val: string | null | undefined): string {
  return (val ?? '').trim()
}
