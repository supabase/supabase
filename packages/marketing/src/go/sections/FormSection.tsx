'use client'

import MarketingForm from '../../forms/MarketingForm'
import type { GoFormSection } from '../schemas'

/**
 * Form props that are safe to ship to the client. The `crm` config from the
 * page registry stays on the server — the client only learns the `{ slug,
 * formId }` it needs to post back. The action then re-resolves `crm` from the
 * trusted registry. See `submitFormAction` and PRODSEC-120.
 */
export type ClientFormSection = Omit<GoFormSection, 'crm'>

export default function FormSection({
  section,
  slug,
}: {
  section: ClientFormSection
  slug: string
}) {
  const formRef = section.id ? { slug, formId: section.id } : undefined

  return (
    <section>
      <div className="max-w-2xl mx-auto px-8">
        <MarketingForm
          fields={section.fields}
          submitLabel={section.submitLabel}
          title={section.title}
          description={section.description}
          disclaimer={section.disclaimer}
          successMessage={section.successMessage}
          successRedirect={section.successRedirect}
          formRef={formRef}
        />
      </div>
    </section>
  )
}
