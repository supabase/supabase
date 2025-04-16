import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { TaxIdFormValues, TaxIdSchema } from './TaxIdForm'
import { useOrganizationTaxIdUpdateMutation } from 'data/organizations/organization-tax-id-update-mutation'
import { sanitizeTaxIdValue } from './TaxID.utils'
import { TAX_IDS } from './TaxID.constants'

interface UseTaxIdFormProps {
  slug?: string
  initialTaxId?: Partial<TaxIdFormValues> | null
  onSuccess?: () => void
}

export function useTaxIdForm({ slug, initialTaxId, onSuccess }: UseTaxIdFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TaxIdFormValues>({
    resolver: zodResolver(TaxIdSchema),
    defaultValues: {
      type: initialTaxId?.type || '',
      value: initialTaxId?.value || '',
      name: initialTaxId?.name || '',
    },
  })

  // Update form when initialTaxId changes
  useEffect(() => {
    if (initialTaxId) {
      form.reset({
        type: initialTaxId?.type || '',
        value: initialTaxId?.value || '',
        name: initialTaxId?.name || '',
      })
    }
  }, [initialTaxId])

  const { mutate: updateTaxId } = useOrganizationTaxIdUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated tax id')
      setIsSubmitting(false)
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast.error(`Failed to update tax id: ${error.message}`)
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (values: TaxIdFormValues) => {
    if (!slug) {
      toast.error('Organization slug is required')
      return
    }

    setIsSubmitting(true)
    const trimmedValues = Object.entries(values).reduce((acc, [key, value]) => {
      acc[key as keyof TaxIdFormValues] = typeof value === 'string' ? value.trim() : value
      return acc
    }, {} as TaxIdFormValues)

    const selectedTaxId = TAX_IDS.find((option) => option.name === values.name)

    updateTaxId({
      slug,
      taxId:
        selectedTaxId && values.type?.length && values.value?.length
          ? {
              type: values.type,
              value: sanitizeTaxIdValue({ value: values.value, name: form.getValues().name }),
              country: selectedTaxId?.countryIso2,
            }
          : null,
    })
  }

  const handleReset = () => {
    if (initialTaxId) {
      form.reset({
        type: initialTaxId?.type || '',
        value: initialTaxId?.value || '',
        name: initialTaxId?.name || '',
      })
    } else {
      form.reset({
        type: '',
        value: '',
        name: '',
      })
    }
  }

  return {
    form,
    isSubmitting,
    handleSubmit,
    handleReset,
    isDirty: form.formState.isDirty,
  }
}
