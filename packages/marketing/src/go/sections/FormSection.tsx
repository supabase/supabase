'use client'

import MarketingForm from '../../forms/MarketingForm'
import type { GoFormSection } from '../schemas'

export default function FormSection({ section }: { section: GoFormSection }) {
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
          crm={section.crm}
        />
      </div>
    </section>
  )
}
