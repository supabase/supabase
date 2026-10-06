import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { FormSection } from 'marketing'

import { getGoPageBySlug } from '@/lib/go'

const GO_PAGE_SLUG = 'multigres-early-access'
const FORM_ID = 'form'

function getMultigresAlphaPage() {
  const page = getGoPageBySlug(GO_PAGE_SLUG)
  const form = page?.sections?.find((section) => section.id === FORM_ID)
  if (!page || form?.type !== 'form') {
    throw new Error(`Go page form "${GO_PAGE_SLUG}#${FORM_ID}" not found`)
  }

  const { crm: _crm, ...clientForm } = form
  return { hero: page.hero, form: clientForm }
}

export function MultigresAlphaSection() {
  const { hero, form } = getMultigresAlphaPage()

  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4 max-w-xl">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter">
          {hero.subtitle}
          <br />
          <span className="text-foreground">{hero.title}</span>
        </h3>
        <p className="text-foreground-lighter">{hero.description}</p>
      </div>
      <FormSection section={form} slug={GO_PAGE_SLUG} />
    </SectionContainerWithCn>
  )
}
