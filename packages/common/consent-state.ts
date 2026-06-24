import type Usercentrics from '@usercentrics/cmp-browser-sdk'
import type { BaseCategory, UserDecision } from '@usercentrics/cmp-browser-sdk'
import { proxy, snapshot, useSnapshot } from 'valtio'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from './constants'

export type PriorConsentDecision =
  | null
  | { kind: 'uniform-accept' }
  | { kind: 'decisions'; decisions: UserDecision[] }

type UcDataServiceEntry = [string, { consent: boolean }]

const isValidUcDataServiceEntry = (entry: [string, unknown]): entry is UcDataServiceEntry => {
  const value = entry[1]
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { consent: unknown }).consent === 'boolean'
  )
}

type UcSettingsService = { id: string; status: boolean }

const isValidUcSettingsService = (service: unknown): service is UcSettingsService =>
  typeof service === 'object' &&
  service !== null &&
  typeof (service as { id: unknown }).id === 'string' &&
  typeof (service as { status: unknown }).status === 'boolean'

/**
 * Check whether the user previously made a consent decision by reading
 * localStorage state that was written before UC.init() overwrites it.
 *
 * Returns enough information for the caller to restore the user's exact
 * prior state via UC.updateServices, or to fast-path via UC.acceptAllServices
 * when we can safely identify a uniform accept. Returns null when nothing
 * trustworthy can be detected — in that case the caller should show the
 * banner rather than fabricate a decision.
 *
 * Handles two scenarios (FE-2648 and GROWTH-790):
 *
 * 1. Slow navigation: GTM's Usercentrics integration replaced uc_settings with
 *    compressed ucString/ucData after the user's decision. On the next page
 *    load, UC.init() can't read that format and treats the user as new. We
 *    read ucData.consent.services directly and return every per-service
 *    decision so the caller can restore the user's exact state — including
 *    mixed states (essentials + functional accepted, tracking denied) that
 *    users produce via the Privacy Settings modal or the Opt out button.
 *
 * 2. Fast navigation: User decided on app A and navigated to app B before GTM
 *    finished writing ucData (or before GTM loaded at all, which happens on
 *    deny since TelemetryTagManager is gated behind hasAccepted). App B's
 *    UC.init() overwrites uc_settings with a fresh controllerId and resets
 *    uc_user_interaction to false. We check uc_user_interaction: "true" as
 *    a gate confirming the user actually interacted, then parse uc_settings
 *    to extract per-service decisions. uc_user_interaction alone is not
 *    enough — without uc_settings we cannot tell accept from deny and must
 *    not fabricate a direction.
 *
 * Both scenarios fail closed: any schema mismatch or partial corruption
 * returns null rather than proceeding with a subset of valid entries.
 * Over-consenting from malformed storage is the worst-direction bias in
 * this domain.
 *
 * Must be called BEFORE UC.init() since init overwrites these keys.
 */
export function detectPriorConsent(): PriorConsentDecision {
  try {
    const ucData = localStorage?.getItem('ucData')
    if (ucData) {
      const data = JSON.parse(ucData)
      const services = data?.consent?.services
      if (services && typeof services === 'object') {
        const rawEntries = Object.entries(services) as Array<[string, unknown]>
        if (rawEntries.length > 0) {
          if (!rawEntries.every(isValidUcDataServiceEntry)) {
            // Partial corruption: don't cherry-pick the valid subset. Fall
            // through to scenario 2 — uc_settings may still be intact.
          } else {
            const entries = rawEntries as UcDataServiceEntry[]
            if (entries.every(([, s]) => s.consent === true)) {
              return { kind: 'uniform-accept' }
            }
            return {
              kind: 'decisions',
              decisions: entries.map(([serviceId, s]) => ({
                serviceId,
                status: s.consent,
              })),
            }
          }
        }
      }
    }

    // uc_user_interaction gates trust in uc_settings — the SDK sets it on any
    // user interaction, which confirms uc_settings holds real decisions rather
    // than ruleset defaults.
    if (localStorage?.getItem('uc_user_interaction') === 'true') {
      const ucSettings = localStorage?.getItem('uc_settings')
      if (ucSettings) {
        const parsed = JSON.parse(ucSettings)
        const services = parsed?.services
        if (
          Array.isArray(services) &&
          services.length > 0 &&
          services.every(isValidUcSettingsService)
        ) {
          const decisions: UserDecision[] = services.map((s) => ({
            serviceId: s.id,
            status: s.status,
          }))
          if (decisions.every((d) => d.status === true)) {
            return { kind: 'uniform-accept' }
          }
          return { kind: 'decisions', decisions }
        }
      }
      // Flag says interacted but uc_settings is missing or malformed.
      // Don't fabricate direction — show the banner on the next init.
    }

    return null
  } catch {
    return null
  }
}

export const consentState = proxy({
  UC: null as Usercentrics | null,
  categories: null as BaseCategory[] | null,

  showConsentToast: false,
  hasConsented: false,
  acceptAll: () => {
    if (!consentState.UC) return
    const previousConsentValue = consentState.hasConsented

    consentState.hasConsented = true
    consentState.showConsentToast = false

    consentState.UC.acceptAllServices()
      .then(() => {
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        consentState.hasConsented = previousConsentValue
        consentState.showConsentToast = true
      })
  },
  denyAll: () => {
    if (!consentState.UC) return
    const previousConsentValue = consentState.hasConsented

    consentState.hasConsented = false
    consentState.showConsentToast = false

    consentState.UC.denyAllServices()
      .then(() => {
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        consentState.showConsentToast = previousConsentValue
      })
  },
  updateServices: (decisions: UserDecision[]) => {
    if (!consentState.UC) return

    consentState.showConsentToast = false

    consentState.UC.updateServices(decisions)
      .then(() => {
        consentState.hasConsented = consentState.UC?.areAllConsentsAccepted() ?? false
        consentState.categories = consentState.UC?.getCategoriesBaseInfo() ?? null
      })
      .catch(() => {
        consentState.showConsentToast = true
      })
  },
})

/**
 * Apply a prior consent decision (or lack of one) to the freshly-initialized
 * Usercentrics SDK and the module's consentState proxy. Extracted from
 * initUserCentrics to make the orchestration unit-testable without mocking
 * the dynamic SDK import. Must be called after UC.init(). Mutates
 * consentState synchronously and may call UC methods asynchronously.
 */
export function applyPriorDecisionToSDK(
  UC: Usercentrics,
  initialUIValues: { initialLayer: number },
  priorDecision: PriorConsentDecision
): void {
  consentState.UC = UC
  const hasConsented = UC.areAllConsentsAccepted()

  // If the SDK wants to show the banner but the user previously made a
  // decision (detected via ucData or uc_settings before init overwrote
  // them), silently re-apply that decision instead of re-prompting
  // (FE-2648, GROWTH-790).
  if (initialUIValues.initialLayer === 0 && !hasConsented && priorDecision) {
    consentState.categories = UC.getCategoriesBaseInfo()
    consentState.showConsentToast = false
    localStorage?.removeItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)

    if (priorDecision.kind === 'uniform-accept') {
      // Uniform accept covers any currently-active service by definition,
      // including any added to the ruleset since the user's decision was
      // stored — acceptAllServices applies to all current services.
      consentState.hasConsented = true
      UC.acceptAllServices()
        .then(() => {
          consentState.categories = UC.getCategoriesBaseInfo()
        })
        .catch(() => {
          consentState.hasConsented = false
          consentState.showConsentToast = true
        })
      return
    }

    // priorDecision.kind === 'decisions'. Only suppress the banner if the
    // stored decisions cover every non-essential service the SDK currently
    // knows about. If the ruleset has grown since the user's ucData/
    // uc_settings was written, force a re-prompt rather than silently
    // defaulting the new service. Essentials are skipped because the SDK
    // forces them on regardless of user decision.
    const currentNonEssentialIds = UC.getServicesBaseInfo()
      .filter((s) => !s.isEssential)
      .map((s) => s.id)
    const coveredIds = new Set(priorDecision.decisions.map((d) => d.serviceId))
    const allCovered = currentNonEssentialIds.every((id) => coveredIds.has(id))

    if (!allCovered) {
      // Fall through to the banner path below. Reset the early writes
      // so the default-branch state assignments take effect correctly.
      consentState.showConsentToast = initialUIValues.initialLayer === 0
      consentState.hasConsented = hasConsented
      return
    }

    // Restore the user's exact per-service state — handles deny and any
    // partial/category-level decision made via Privacy Settings. hasConsented
    // is computed from SDK state after the restore resolves (will be false
    // unless every service was accepted).
    UC.updateServices(priorDecision.decisions)
      .then(() => {
        consentState.hasConsented = UC.areAllConsentsAccepted()
        consentState.categories = UC.getCategoriesBaseInfo()
      })
      .catch(() => {
        // Falling back to the banner is safer than silently flipping to a
        // uniform state the user didn't choose.
        consentState.showConsentToast = true
      })
    return
  }

  // 0 = first layer, aka show consent toast
  consentState.showConsentToast = initialUIValues.initialLayer === 0
  consentState.hasConsented = hasConsented
  consentState.categories = UC.getCategoriesBaseInfo()

  // If the user has previously consented (before usercentrics), accept all services
  if (!hasConsented && localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) === 'true') {
    consentState.acceptAll()
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
  }
}

async function initUserCentrics() {
  if (process.env.NODE_ENV === 'test' || !IS_PLATFORM) return

  // [Alaister] For local development and staging, we accept all consent by default.
  // If you need to test usercentrics in these environments, comment out this
  // NEXT_PUBLIC_ENVIRONMENT check and add an ngrok domain to usercentrics
  if (
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
  ) {
    consentState.hasConsented = true
    return
  }

  // Check for prior consent BEFORE UC.init(), which can't read the compressed
  // ucData format written by the GTM/Usercentrics integration (FE-2648).
  const priorDecision = detectPriorConsent()

  try {
    const { default: Usercentrics } = await import('@usercentrics/cmp-browser-sdk')

    const UC = new Usercentrics(process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID!, {
      rulesetId: process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID,
      useRulesetId: true,
    })

    const initialUIValues = await UC.init()
    applyPriorDecisionToSDK(UC, initialUIValues, priorDecision)
  } catch (error) {
    console.error('Failed to initialize Usercentrics:', error)
    // If SDK fails but user previously accepted uniformly, honor that.
    // For explicit per-service decisions we can't restore without the SDK,
    // and showing the banner when the SDK is broken would fail anyway.
    if (priorDecision?.kind === 'uniform-accept') {
      consentState.hasConsented = true
    }
  }
}

// Usercentrics is not available on the server
if (typeof window !== 'undefined') {
  initUserCentrics()
}

export function hasConsented() {
  return snapshot(consentState).hasConsented
}

export function useConsentState() {
  const snap = useSnapshot(consentState)

  return {
    hasAccepted: snap.hasConsented,
    categories: snap.categories as BaseCategory[] | null,
    acceptAll: snap.acceptAll,
    denyAll: snap.denyAll,
    updateServices: snap.updateServices,
  }
}
