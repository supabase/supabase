import type Usercentrics from '@usercentrics/cmp-browser-sdk'
import type { BaseCategory, UserDecision } from '@usercentrics/cmp-browser-sdk'
import { proxy, ref, snapshot, useSnapshot } from 'valtio'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from './constants'

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

  try {
    const { default: Usercentrics } = await import('@usercentrics/cmp-browser-sdk')

    const UC = new Usercentrics(process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID!, {
      rulesetId: process.env.NEXT_PUBLIC_USERCENTRICS_RULESET_ID,
      useRulesetId: true,
    })

    const initialUIValues = await UC.init()

    // ref() prevents valtio from recursively proxying the SDK instance's internals in place,
    // which would corrupt them the same way it once corrupted the AI Assistant's message array
    consentState.UC = ref(UC)
    const hasConsented = UC.areAllConsentsAccepted()

    // 0 = first layer, aka show consent toast
    consentState.showConsentToast = initialUIValues.initialLayer === 0
    consentState.hasConsented = hasConsented
    consentState.categories = UC.getCategoriesBaseInfo()

    // If the user has previously consented (before usercentrics), accept all services
    if (!hasConsented && localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) === 'true') {
      consentState.acceptAll()
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
    }
  } catch (error) {
    console.error('Failed to initialize Usercentrics:', error)
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
