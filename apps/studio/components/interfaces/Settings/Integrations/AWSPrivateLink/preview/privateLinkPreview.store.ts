/**
 * Prototype-only. Delete with the preview folder when splitting Track B.
 */

import { proxy, useSnapshot } from 'valtio'

import {
  getPreviewNavManagedBy,
  getPrivateLinkPreviewScenarioConfig,
  isPrivateLinkPreviewScenario,
  isVercelMarketplacePreviewCard,
  PRIVATE_LINK_PREVIEW_QUERY,
  PRIVATE_LINK_PREVIEW_SCENARIO_QUERY,
  PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY,
  PRIVATE_LINK_PREVIEW_STORAGE_KEY,
  type PrivateLinkPreviewScenario,
} from './privateLinkPreview.constants'
import { getPreviewAccounts } from './privateLinkPreview.mocks'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { ManagedBy } from '@/lib/constants/infrastructure'

const DEFAULT_SCENARIO: PrivateLinkPreviewScenario = 'empty'

function readSession(key: string) {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    // Ignore quota / private mode.
  }
}

function readEnabledFromWindow() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get(PRIVATE_LINK_PREVIEW_QUERY) === '1') return true
  return readSession(PRIVATE_LINK_PREVIEW_STORAGE_KEY) === '1'
}

function readScenarioFromWindow(): PrivateLinkPreviewScenario {
  if (typeof window === 'undefined') return DEFAULT_SCENARIO
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get(PRIVATE_LINK_PREVIEW_SCENARIO_QUERY)
  if (fromQuery && isPrivateLinkPreviewScenario(fromQuery)) return fromQuery
  const fromSession = readSession(PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY)
  if (fromSession && isPrivateLinkPreviewScenario(fromSession)) return fromSession
  return DEFAULT_SCENARIO
}

export const privateLinkPreviewState = proxy({
  hydrated: false,
  enabled: false,
  scenario: DEFAULT_SCENARIO as PrivateLinkPreviewScenario,
  hydrate: () => {
    const enabled = readEnabledFromWindow()
    const scenario = readScenarioFromWindow()
    privateLinkPreviewState.enabled = enabled
    privateLinkPreviewState.scenario = scenario
    privateLinkPreviewState.hydrated = true
    if (enabled) {
      writeSession(PRIVATE_LINK_PREVIEW_STORAGE_KEY, '1')
      writeSession(PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY, scenario)
    }
  },
  setEnabled: (enabled: boolean) => {
    privateLinkPreviewState.enabled = enabled
    writeSession(PRIVATE_LINK_PREVIEW_STORAGE_KEY, enabled ? '1' : null)
    if (!enabled) writeSession(PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY, null)
  },
  setScenario: (scenario: PrivateLinkPreviewScenario) => {
    privateLinkPreviewState.scenario = scenario
    writeSession(PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY, scenario)
  },
})

export function usePrivateLinkPreview() {
  const snap = useSnapshot(privateLinkPreviewState)
  const { data: project } = useSelectedProjectQuery()
  const config = getPrivateLinkPreviewScenarioConfig(snap.scenario)
  const isActive = snap.enabled && snap.hydrated

  return {
    hydrated: snap.hydrated,
    enabled: isActive,
    scenario: snap.scenario,
    config,
    accounts: isActive ? getPreviewAccounts(snap.scenario, project?.ref) : undefined,
    vercelCard: isActive ? config.vercelCard : 'live',
    showPrivateHostname: isActive && config.showPrivateHostname,
    showRestrictPublicAccess: isActive && config.showRestrictPublicAccess,
    prefillAwsAccountId: isActive ? config.prefillAwsAccountId : undefined,
    skipUpgradeWall: isActive,
    b5Note: isActive ? config.b5Note : undefined,
    showVercelMarketplaceNav: isActive && isVercelMarketplacePreviewCard(config.vercelCard),
  }
}

export function usePreviewNavManagedBy(managedBy: ManagedBy | undefined): ManagedBy | undefined {
  const { showVercelMarketplaceNav } = usePrivateLinkPreview()
  return getPreviewNavManagedBy(managedBy, showVercelMarketplaceNav)
}
