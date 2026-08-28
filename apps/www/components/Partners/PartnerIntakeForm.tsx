'use client'

import { MarketingForm } from 'marketing/forms'
import { parseAsString, useQueryState } from 'nuqs'

import { fields } from './PartnerIntakeForm.fields'

const successMessage =
  'We’ve received your submission. Our team reviews every application — if there’s a good fit with the program you selected, we’ll be in touch to discuss next steps.'

interface PartnerIntakeFormProps {
  className?: string
}

export default function PartnerIntakeForm({ className }: PartnerIntakeFormProps) {
  const [partnerType] = useQueryState('partner_type', parseAsString.withDefault(''))

  return (
    <MarketingForm
      // forces a remount so the partnerType preset
      // applies whenever the URL value changes.
      key={partnerType}
      className={className}
      fields={fields}
      submitLabel="Submit application"
      formRef={{ slug: 'partners', formId: 'become-a-partner' }}
      successMessage={successMessage}
      initialValues={partnerType ? { partner_type: partnerType } : undefined}
    />
  )
}
