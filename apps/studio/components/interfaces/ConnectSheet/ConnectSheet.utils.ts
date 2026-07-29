import type { ConnectMode } from './Connect.types'
import { CONNECT_MODES } from './Connect.types'
import type { ConnectSheetPrefs } from './useConnectSheetParams'

export type ConnectSheetQueryParams = {
  connectTab: string | null
  framework: string | null
  using: string | null
  method: string | null
  type: string | null
  mcpClient: string | null
}

export type ConnectSheetUrlUpdates = Partial<Record<keyof ConnectSheetQueryParams, string | null>>

export type ConnectSheetFieldUpdate = { fieldId: string; value: string }

export type ConnectSheetHydration = {
  mode: ConnectMode | null
  fieldUpdates: ConnectSheetFieldUpdate[]
  urlUpdates: ConnectSheetUrlUpdates
}

function isConnectMode(value: string): value is ConnectMode {
  return CONNECT_MODES.some((mode) => mode === value)
}

export function mapConnectTabToMode(tab: string | null): ConnectMode | null {
  if (!tab) return null
  switch (tab) {
    case 'frameworks':
    case 'mobiles':
      return 'framework'
    case 'orms':
      return 'orm'
    default:
      return isConnectMode(tab) ? tab : null
  }
}

/**
 * Computes what should happen when the Connect sheet is opened: which mode/fields
 * to hydrate from storedPrefs (falling back for whatever isn't already in the URL),
 * and which URL params to backfill so the URL reflects the restored state.
 *
 * Field/URL updates are driven by `mappedMode` regardless of whether that mode is
 * currently available — only the `mode` result (used to call `setMode`) is gated on
 * `availableModeIds`, matching the sheet's pre-extraction behavior.
 */
export function resolveConnectSheetHydration(
  query: ConnectSheetQueryParams,
  storedPrefs: ConnectSheetPrefs,
  availableModeIds: ConnectMode[]
): ConnectSheetHydration {
  const effectiveTab = query.connectTab ?? storedPrefs.connectTab ?? null
  const effectiveFramework = query.framework ?? storedPrefs.framework ?? null
  const effectiveUsing = query.using ?? storedPrefs.using ?? null
  const effectiveMethod = query.method ?? storedPrefs.method ?? null
  const effectiveType = query.type ?? storedPrefs.type ?? null
  const effectiveMcpClient = query.mcpClient ?? storedPrefs.mcpClient ?? null

  const mappedMode = mapConnectTabToMode(effectiveTab)
  const mode = mappedMode && availableModeIds.includes(mappedMode) ? mappedMode : null

  const fieldUpdates: ConnectSheetFieldUpdate[] = []
  const urlUpdates: ConnectSheetUrlUpdates = {}

  if (query.connectTab === null && effectiveTab) urlUpdates.connectTab = effectiveTab

  if (mappedMode === 'framework') {
    if (effectiveFramework) {
      fieldUpdates.push({ fieldId: 'framework', value: effectiveFramework })
      if (query.framework === null) urlUpdates.framework = effectiveFramework
      if (effectiveUsing) {
        fieldUpdates.push({ fieldId: 'frameworkVariant', value: effectiveUsing })
        if (query.using === null) urlUpdates.using = effectiveUsing
      }
    }
  } else if (mappedMode === 'orm') {
    if (effectiveFramework) {
      fieldUpdates.push({ fieldId: 'orm', value: effectiveFramework })
      if (query.framework === null) urlUpdates.framework = effectiveFramework
    }
  } else if (mappedMode === 'direct') {
    if (effectiveMethod) {
      fieldUpdates.push({ fieldId: 'connectionMethod', value: effectiveMethod })
      if (query.method === null) urlUpdates.method = effectiveMethod
    }
    if (effectiveType) {
      fieldUpdates.push({ fieldId: 'connectionType', value: effectiveType })
      if (query.type === null) urlUpdates.type = effectiveType
    }
  } else if (mappedMode === 'mcp') {
    if (effectiveMcpClient) {
      fieldUpdates.push({ fieldId: 'mcpClient', value: effectiveMcpClient })
      if (query.mcpClient === null) urlUpdates.mcpClient = effectiveMcpClient
    }
  }

  return { mode, fieldUpdates, urlUpdates }
}
