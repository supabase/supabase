import { zodResolver } from '@hookform/resolvers/zod'
import type {
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions,
} from '@stripe/stripe-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { TaxIdFormValues, TaxIdSchema } from './BillingCustomerDataForm'
import { TAX_IDS } from './TaxID.constants'
import { getEffectiveTaxCountry, resolveStoredTaxId, sanitizeTaxIdValue } from './TaxID.utils'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'

type StripeAddressValue = StripeAddressElementChangeEvent['value']
type StripeAddressValidationState = 'unknown' | 'complete' | 'incomplete'
type StripeAddressElementValueResult = Awaited<ReturnType<StripeAddressElement['getValue']>>

interface UseBillingCustomerDataFormProps {
  customerProfile?: {
    address?: CustomerAddress | null
    billing_name?: string
  } | null
  taxId?: CustomerTaxId | null
  onCustomerDataChange: (data: BillingAddressPayload) => Promise<void>
}

export type BillingAddressPayload = {
  address: CustomerAddress | undefined
  billing_name: string
  tax_id: CustomerTaxId | null
}

type SubmittedBillingFormState = {
  addressValue: StripeAddressValue
  taxIdValues: TaxIdFormValues
}

type BillingFormSubmitResult =
  | {
      status: 'error'
      message: string
    }
  | {
      status: 'success'
      submittedState: SubmittedBillingFormState
    }

export function useBillingCustomerDataForm({
  customerProfile,
  taxId,
  onCustomerDataChange,
}: UseBillingCustomerDataFormProps) {
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

  const stripeAddressRef = useRef<StripeAddressValue>(initialStripeAddressValue)
  const savedStripeAddressRef = useRef<StripeAddressValue>(initialStripeAddressValue)
  const stripeAddressValidationRef = useRef<StripeAddressValidationState>('unknown')
  const savedTaxIdValuesRef = useRef<TaxIdFormValues>(initialTaxIdValues)
  const [isAddressDirty, setIsAddressDirty] = useState(false)
  const [addressCountry, setAddressCountry] = useState<string | undefined>(
    initialStripeAddressValue.address.country || undefined
  )
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    savedStripeAddressRef.current = initialStripeAddressValue
    savedTaxIdValuesRef.current = initialTaxIdValues
    form.reset(initialTaxIdValues)
    stripeAddressRef.current = initialStripeAddressValue
    stripeAddressValidationRef.current = 'unknown'
    setIsAddressDirty(false)
    setAddressCountry(initialStripeAddressValue.address.country || undefined)
    setResetKey((c) => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStripeAddressValue, initialTaxIdValues])

  const onAddressChange = useCallback((evt: StripeAddressElementChangeEvent) => {
    stripeAddressRef.current = evt.value
    stripeAddressValidationRef.current = evt.complete ? 'complete' : 'incomplete'
    setAddressCountry(evt.value.address.country || undefined)
    setIsAddressDirty(!isAddressEqual(evt.value, savedStripeAddressRef.current))
  }, [])

  const applyAddressElementValue = useCallback((result: StripeAddressElementValueResult) => {
    stripeAddressRef.current = result.value
    stripeAddressValidationRef.current = result.complete ? 'complete' : 'incomplete'
    setAddressCountry(result.value.address.country || undefined)
    setIsAddressDirty(!isAddressEqual(result.value, savedStripeAddressRef.current))
  }, [])

  const isDirty = isAddressDirty || form.formState.isDirty

  const syncCurrentState = useCallback(
    (addressValue: StripeAddressValue, taxIdValues: TaxIdFormValues) => {
      form.reset(taxIdValues)
      stripeAddressRef.current = addressValue
      stripeAddressValidationRef.current = 'unknown'
      setIsAddressDirty(false)
      setAddressCountry(addressValue.address.country || undefined)
    },
    [form]
  )

  const handleSubmit = async (): Promise<BillingFormSubmitResult> => {
    const address = stripeAddressRef.current
    const addressWasEdited =
      isAddressDirty || !isAddressEqual(address, savedStripeAddressRef.current)

    if (!address.name?.trim()) {
      return { status: 'error', message: 'Full name is required.' }
    }
    if (!address.address.country?.trim()) {
      return { status: 'error', message: 'Country is required.' }
    }
    if (!address.address.line1?.trim()) {
      return { status: 'error', message: 'Address Line 1 is required.' }
    }
    if (addressWasEdited && stripeAddressValidationRef.current === 'incomplete') {
      return { status: 'error', message: 'Please enter a valid billing address.' }
    }

    const taxIdValues = form.getValues()
    const selectedTaxId = TAX_IDS.find((option) => option.name === taxIdValues.tax_id_name)

    const payload = {
      address: {
        line1: address.address.line1.trim(),
        line2: address.address.line2?.trim() || undefined,
        city: address.address.city.trim(),
        state: address.address.state?.trim() || undefined,
        postal_code: address.address.postal_code.trim(),
        country: address.address.country.trim(),
      },
      billing_name: address.name.trim(),
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
    }

    await onCustomerDataChange(payload)

    return {
      status: 'success',
      submittedState: { addressValue: address, taxIdValues },
    }
  }

  const markCurrentValuesAsSaved = (
    addressValue: StripeAddressValue,
    taxIdValues: TaxIdFormValues
  ) => {
    savedStripeAddressRef.current = addressValue
    savedTaxIdValuesRef.current = taxIdValues
    syncCurrentState(addressValue, taxIdValues)
  }

  const handleReset = () => {
    syncCurrentState(savedStripeAddressRef.current, savedTaxIdValuesRef.current)
    setResetKey((c) => c + 1)
  }

  return {
    form,
    handleSubmit,
    handleReset,
    isDirty,
    resetKey,
    onAddressChange,
    applyAddressElementValue,
    markCurrentValuesAsSaved,
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
