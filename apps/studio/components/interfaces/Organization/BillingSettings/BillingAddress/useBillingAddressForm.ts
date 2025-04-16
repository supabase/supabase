import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { BillingAddressFormValues, BillingAddressSchema } from './BillingAddressForm'

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
      billing_name: initialAddress?.billing_name || '',
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
        billing_name: initialAddress.billing_name || '',
        line1: initialAddress.line1 || '',
        line2: initialAddress.line2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postal_code: initialAddress.postal_code || '',
        country: initialAddress.country || '',
      })
    }
  }, [initialAddress])

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
    updateCustomerProfile({
      slug,
      address: addressPayload as any,
      billing_name: trimmedValues.billing_name,
    })
  }

  const handleReset = () => {
    if (initialAddress) {
      form.reset({
        billing_name: initialAddress.billing_name || '',
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
