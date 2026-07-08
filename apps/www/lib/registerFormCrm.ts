import 'server-only'

import { setFormCrmResolver } from 'marketing'

import { getGoPageBySlug } from './go'

/**
 * Wire the marketing form server action to look up the trusted CRM config for
 * a `{ slug, formId }` pair from the in-process page registry. Without this,
 * `submitFormAction` fails closed and rejects every submission. See
 * PRODSEC-120 for why the CRM config must never come from the client.
 */
export function registerFormCrmResolver() {
  setFormCrmResolver(({ slug, formId }) => {
    const page = getGoPageBySlug(slug)
    if (!page || !('sections' in page) || !page.sections) return undefined

    const section = page.sections.find((s) => s.type === 'form' && s.id === formId)
    if (!section || section.type !== 'form') return undefined

    return section.crm
  })
}
