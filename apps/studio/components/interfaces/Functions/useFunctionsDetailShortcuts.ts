import { useNavigate } from '@tanstack/react-router'

import { navigateToUrl } from '@/lib/navigation'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseFunctionsDetailShortcutsParams {
  projectRef: string | undefined
  functionSlug: string | undefined
  canReadFunctions: boolean
  isPlatform: boolean
  hasInvocationsTab: boolean
  onOpenTest: () => void
  onOpenDownload: () => void
  onCopyUrl: () => void
}

/**
 * Registers shortcuts that apply across every tab of a single edge function:
 *   - 1..5: jump between Overview / Invocations / Logs / Code / Settings
 *   - Shift+T: open the test sheet
 *   - Shift+D: open the download popover
 *   - Shift+C: copy the function URL
 *
 * Should be mounted once at the EdgeFunctionDetailsLayout level.
 */
export function useFunctionsDetailShortcuts({
  projectRef,
  functionSlug,
  canReadFunctions,
  isPlatform,
  hasInvocationsTab,
  onOpenTest,
  onOpenDownload,
  onCopyUrl,
}: UseFunctionsDetailShortcutsParams) {
  const navigate = useNavigate()

  const ready = Boolean(projectRef && functionSlug)
  const shortcutsEnabled = ready && canReadFunctions
  const base = `/project/${projectRef}/functions/${functionSlug}`
  const goTo = (path: string) => () => void navigateToUrl(navigate, `${base}${path}`)

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_OVERVIEW, goTo(''), {
    enabled: shortcutsEnabled && isPlatform,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_INVOCATIONS, goTo('/invocations'), {
    enabled: shortcutsEnabled && isPlatform && hasInvocationsTab,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_LOGS, goTo('/logs'), {
    enabled: shortcutsEnabled && isPlatform,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_CODE, goTo('/code'), {
    enabled: shortcutsEnabled,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_SETTINGS, goTo('/details'), {
    enabled: shortcutsEnabled,
  })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST, onOpenTest, {
    enabled: shortcutsEnabled,
  })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD, onOpenDownload, {
    enabled: shortcutsEnabled,
  })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL, onCopyUrl, {
    enabled: shortcutsEnabled,
  })
}
