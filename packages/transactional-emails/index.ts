import { createElement, type ReactElement } from 'react'

import { computeAvailable } from './emails/ComputeAvailable'
import { computeQuotaOverage } from './emails/ComputeQuotaOverage'
import { computeQuotaProjected } from './emails/ComputeQuotaProjected'
import { computeQuotaReset } from './emails/ComputeQuotaReset'
import { computeQuotaStopped } from './emails/ComputeQuotaStopped'
import { computeQuotaWarning } from './emails/ComputeQuotaWarning'
import type { EmailTemplate } from './emails/shared'

export type { EmailTemplate } from './emails/shared'

export interface RenderableTemplate {
  id: string
  trigger: string
  subject: string
  element: ReactElement
}

/** Erases the per-template props type so templates can sit in one list. */
const toRenderable = <TProps extends object>(
  template: EmailTemplate<TProps>
): RenderableTemplate => ({
  id: template.id,
  trigger: template.trigger,
  subject: template.subject(template.previewProps),
  element: createElement(template.Template, template.previewProps),
})

/**
 * Ordered by where they sit in the lifecycle rather than alphabetically, because the order is
 * the argument: one onboarding note, then escalating quota notices, then recovery.
 */
export const templates: RenderableTemplate[] = [
  toRenderable(computeAvailable),
  toRenderable(computeQuotaProjected),
  toRenderable(computeQuotaWarning),
  toRenderable(computeQuotaOverage),
  toRenderable(computeQuotaStopped),
  toRenderable(computeQuotaReset),
]
