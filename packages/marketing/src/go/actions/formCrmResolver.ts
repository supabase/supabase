import 'server-only'

import type { GoFormCrmConfig } from '../schemas'

export interface FormRef {
  slug: string
  formId: string
}

export type FormCrmResolver = (
  ref: FormRef
) => GoFormCrmConfig | undefined | Promise<GoFormCrmConfig | undefined>

/**
 * The resolver is stored on `globalThis` rather than in a module-level variable.
 * `instrumentation.ts` registers it via the `marketing` package barrel, while
 * `submitFormAction` reads it via a relative import. In a bundled build those
 * two paths can resolve to separate instances of this module, so a plain
 * module-level singleton set on one instance is invisible to the other — the
 * action then sees `null` and every submission fails with "Form not found".
 * A `globalThis` slot is shared across all module instances in the process.
 */
const RESOLVER_KEY = Symbol.for('marketing.go.formCrmResolver')

type ResolverStore = { [key: symbol]: FormCrmResolver | null | undefined }

function resolverStore(): ResolverStore {
  return globalThis as unknown as ResolverStore
}

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
  resolverStore()[RESOLVER_KEY] = fn
}

export async function resolveFormCrmConfig(ref: FormRef): Promise<GoFormCrmConfig | undefined> {
  const resolver = resolverStore()[RESOLVER_KEY]
  if (!resolver) return undefined
  return await resolver(ref)
}
