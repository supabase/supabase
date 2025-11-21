import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { BillingCustomerDataFormValues, BillingCustomerDataSchema } from './BillingCustomerDataForm'
import { TAX_IDS } from './TaxID.constants'
import { sanitizeTaxIdValue } from './TaxID.utils'
import { components } from 'api-types'
import type { CustomerAddress } from 'data/organizations/types'

export type FormCustomerData = {
  address: CustomerAddress | undefined
  billing_name: string
  tax_id: components['schemas']['TaxIdResponse']['tax_id'] | null
}

interface UseBillingAddressFormProps {
  initialCustomerData?: Partial<BillingCustomerDataFormValues> | null
  onCustomerDataChange: (data: FormCustomerData) => void
}

export function useBillingCustomerDataForm({
  initialCustomerData,
  onCustomerDataChange,
}: UseBillingAddressFormProps) {
  const form = useForm<BillingCustomerDataFormValues>({
    resolver: zodResolver(BillingCustomerDataSchema),
    defaultValues: {
      billing_name: initialCustomerData?.billing_name || '',
      line1: initialCustomerData?.line1 || '',
      line2: initialCustomerData?.line2 || '',
      city: initialCustomerData?.city || '',
      state: initialCustomerData?.state || '',
      postal_code: initialCustomerData?.postal_code || '',
      country: initialCustomerData?.country || '',
      tax_id_type: initialCustomerData?.tax_id_type || '',
      tax_id_value: initialCustomerData?.tax_id_value || '',
      tax_id_name: initialCustomerData?.tax_id_name || '',
    },
  })

  // Update form when initialAddress changes
  useEffect(() => {
    if (initialCustomerData) {
      form.reset({
        billing_name: initialCustomerData.billing_name || '',
        line1: initialCustomerData.line1 || '',
        line2: initialCustomerData.line2 || '',
        city: initialCustomerData.city || '',
        state: initialCustomerData.state || '',
        postal_code: initialCustomerData.postal_code || '',
        country: initialCustomerData.country || '',
        tax_id_type: initialCustomerData?.tax_id_type || '',
        tax_id_value: initialCustomerData?.tax_id_value || '',
        tax_id_name: initialCustomerData?.tax_id_name || '',
      })
    }
  }, [initialCustomerData])

  const handleSubmit = async (values: BillingCustomerDataFormValues) => {
    const trimmedValues = Object.entries(values).reduce((acc, [key, value]) => {
      acc[key as keyof BillingCustomerDataFormValues] =
        typeof value === 'string' ? value.trim() : value
      return acc
    }, {} as BillingCustomerDataFormValues)

    const addressPayload = !trimmedValues.line1 ? null : trimmedValues

    const selectedTaxId = TAX_IDS.find((option) => option.name === values.tax_id_name)

    onCustomerDataChange({
      address: addressPayload
        ? {
            line1: trimmedValues.line1!,
            line2: trimmedValues.line2,
            city: trimmedValues.city,
            state: trimmedValues.state,
            postal_code: trimmedValues.postal_code,
            country: trimmedValues.country!,
          }
        : undefined,
      billing_name: trimmedValues.billing_name,
      tax_id:
        selectedTaxId && values.tax_id_type?.length && values.tax_id_value?.length
          ? {
              type: values.tax_id_type,
              value: sanitizeTaxIdValue({
                value: values.tax_id_value,
                name: form.getValues().tax_id_name,
              }),
              country: selectedTaxId?.countryIso2,
            }
          : null,
    })
  }

  const handleReset = () => {
    if (initialCustomerData) {
      form.reset({
        billing_name: initialCustomerData.billing_name || '',
        line1: initialCustomerData.line1 || '',
        line2: initialCustomerData.line2 || '',
        city: initialCustomerData.city || '',
        state: initialCustomerData.state || '',
        postal_code: initialCustomerData.postal_code || '',
        country: initialCustomerData.country || '',
        tax_id_type: initialCustomerData?.tax_id_type || '',
        tax_id_value: initialCustomerData?.tax_id_value || '',
        tax_id_name: initialCustomerData?.tax_id_name || '',
      })
    } else {
      form.reset({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        tax_id_type: '',
        tax_id_value: '',
        tax_id_name: '',
      })
    }
  }

  return {
    form,
    handleSubmit,
    handleReset,
    isDirty: form.formState.isDirty,
  }
}
