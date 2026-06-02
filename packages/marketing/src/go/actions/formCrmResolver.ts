import 'server-only'

import type { GoFormCrmConfig } from '../schemas'

export interface FormRef {
  slug: string
  formId: string
}

export type FormCrmResolver = (
  ref: FormRef
) => GoFormCrmConfig | undefined | Promise<GoFormCrmConfig | undefined>

let resolver: FormCrmResolver | null = null

/**
 * Register the function used by `submitFormAction` to look up the trusted CRM
 * config for a form. The consuming app must call this at server startup so the
 * server action can resolve a `{ slug, formId }` posted from the client back to
 * the same config that lives in the page registry.
 *
 * The CRM config must never be sourced from the client — see
 * `submitFormAction` for the security rationale.
 */
export function setFormCrmResolver(fn: FormCrmResolver): void {
  resolver = fn
}

export async function resolveFormCrmConfig(ref: FormRef): Promise<GoFormCrmConfig | undefined> {
  if (!resolver) return undefined
  return await resolver(ref)
}
