import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'

// Define the expected form values structure and validation schema
export const BillingAddressSchema = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasAnyField = data.line1 || data.line2 || data.city || data.state || data.postal_code
      // If any field has value, country and line1 must have values.
      return !hasAnyField || (!!data.country && !!data.line1)
    },
    {
      message: 'Country and Address line 1 are required if any other field is provided.',
      path: ['line1'],
    }
  )
  .refine((data) => !(!!data.line1 && !data.country), {
    message: 'Please select a country',
    path: ['country'],
  })
  .refine((data) => !(!!data.country && !data.line1), {
    message: 'Please provide an address line 1',
    path: ['line1'],
  })

export type BillingAddressFormValues = z.infer<typeof BillingAddressSchema>

interface UseBillingAddressFormProps {
  slug?: string
  initialAddress?: Partial<BillingAddressFormValues> | null
  onSuccess?: () => void
}

export function useBillingAddressForm({
  slug,
  initialAddress,
  onSuccess,
}: UseBillingAddressFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BillingAddressFormValues>({
    resolver: zodResolver(BillingAddressSchema),
    defaultValues: {
      line1: initialAddress?.line1 || '',
      line2: initialAddress?.line2 || '',
      city: initialAddress?.city || '',
      state: initialAddress?.state || '',
      postal_code: initialAddress?.postal_code || '',
      country: initialAddress?.country || '',
    },
  })

  // Update form when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      form.reset({
        line1: initialAddress.line1 || '',
        line2: initialAddress.line2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postal_code: initialAddress.postal_code || '',
        country: initialAddress.country || '',
      })
    }
  }, [initialAddress, form])

  const { mutate: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated billing address')
      setIsSubmitting(false)
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast.error(`Failed to update billing address: ${error.message}`)
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (values: BillingAddressFormValues) => {
    if (!slug) {
      toast.error('Organization slug is required')
      return
    }

    setIsSubmitting(true)
    const trimmedValues = Object.entries(values).reduce((acc, [key, value]) => {
      acc[key as keyof BillingAddressFormValues] = typeof value === 'string' ? value.trim() : value
      return acc
    }, {} as BillingAddressFormValues)

    const addressPayload = !trimmedValues.line1 ? null : trimmedValues
    updateCustomerProfile({ slug, address: addressPayload as any })
  }

  const handleReset = () => {
    if (initialAddress) {
      form.reset({
        line1: initialAddress.line1 || '',
        line2: initialAddress.line2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postal_code: initialAddress.postal_code || '',
        country: initialAddress.country || '',
      })
    } else {
      form.reset({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
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
