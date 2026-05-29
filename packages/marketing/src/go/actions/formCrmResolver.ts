import 'server-only'

import type { GoFormCrmConfig } from '../schemas'

export interface FormRef {
  slug: string
  formId: string
}

export type FormCrmResolver = (
  ref: FormRef
) => GoFormCrmConfig | undefined | Promise<GoFormCrmConfig | undefined>

// The resolver is registered once at server startup (via the consuming app's
// `instrumentation.ts`, which runs in the Node runtime layer) but read from the
// `submitFormAction` server action (which runs in the React Server Components
// layer). Those are separate module graphs in the same process, so a plain
// module-level `let` is NOT shared between them — the value written by
// instrumentation is invisible to the action, which then rejects every
// submission with "form not found in registry". Stash it on `globalThis`
// (shared across both layers) keyed by a registry symbol so both sides see the
// same reference.
// `Symbol.for` returns a plain `symbol` (not a `unique symbol`), so it can't be
// used as a computed key in a type literal — index `globalThis` through a
// symbol-keyed record cast instead.
const RESOLVER_KEY = Symbol.for('supabase.marketing.go.formCrmResolver')

const globalStore = globalThis as unknown as Record<symbol, FormCrmResolver | null | undefined>

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
  globalStore[RESOLVER_KEY] = fn
}

export async function resolveFormCrmConfig(ref: FormRef): Promise<GoFormCrmConfig | undefined> {
  const resolver = globalStore[RESOLVER_KEY] ?? null
  if (!resolver) return undefined
  return await resolver(ref)
}
