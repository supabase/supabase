import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { MarketingForm } from 'marketing/forms'
import { Button } from 'ui'

import { getGoPageBySlug } from '@/lib/go'

const GO_PAGE_SLUG = 'multigres-early-access'
const FORM_ID = 'form'

function getMultigresAlphaPage() {
  const page = getGoPageBySlug(GO_PAGE_SLUG)
  const form = page?.sections?.find((section) => section.id === FORM_ID)
  if (!page || form?.type !== 'form') {
    throw new Error(`Go page form "${GO_PAGE_SLUG}#${FORM_ID}" not found`)
  }

  return { hero: page.hero, form }
}

export function MultigresAlphaSection() {
  const { hero, form } = getMultigresAlphaPage()

  return (
    <SectionContainerWithCn>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl md:text-4xl text-foreground-lighter">
            {hero.subtitle}
            <br />
            <span className="text-foreground">{hero.title}</span>
          </h3>
          <p className="text-foreground-light">{hero.description}</p>
          <p className="text-foreground-lighter text-sm">{form.description}</p>
          <div>
            <Button size="small" asChild>
              <a href="https://multigres.com" target="_blank" rel="noreferrer">
                Learn about Multigres
              </a>
            </Button>
          </div>
        </div>
        <MarketingForm
          fields={form.fields}
          submitLabel={form.submitLabel}
          disclaimer={form.disclaimer}
          successMessage={form.successMessage}
          successRedirect={form.successRedirect}
          formRef={{ slug: GO_PAGE_SLUG, formId: FORM_ID }}
        />
      </div>
    </SectionContainerWithCn>
  )
}
