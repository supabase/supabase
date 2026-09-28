'use client'

import { MarketingForm } from 'marketing/forms'
import { parseAsString, useQueryState } from 'nuqs'

import { fields } from './PartnerIntakeForm.fields'

// Keep in sync with the thank-you message on the HubSpot form.
const successMessage = `We appreciate your interest in partnering with Supabase. Our team reviews every submission, and if there’s a good fit with the program you’ve expressed interest in, we’ll be in touch to discuss next steps.

If you’re a technology partner looking to get a head start, you can begin building your OAuth integration today using our [integration guide](/docs/guides/integrations/build-a-supabase-oauth-integration).`

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
