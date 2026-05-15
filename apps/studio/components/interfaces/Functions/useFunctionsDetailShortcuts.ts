import { useRouter } from 'next/router'

import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseFunctionsDetailShortcutsParams {
  projectRef: string | undefined
  functionSlug: string | undefined
  isPlatform: boolean
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
  isPlatform,
  onOpenTest,
  onOpenDownload,
  onCopyUrl,
}: UseFunctionsDetailShortcutsParams) {
  const router = useRouter()

  const ready = Boolean(projectRef && functionSlug)
  const base = `/project/${projectRef}/functions/${functionSlug}`

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_OVERVIEW, () => router.push(base), {
    enabled: ready && isPlatform,
  })

  useShortcut(
    SHORTCUT_IDS.NAV_FUNCTION_DETAIL_INVOCATIONS,
    () => router.push(`${base}/invocations`),
    { enabled: ready && isPlatform }
  )

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_LOGS, () => router.push(`${base}/logs`), {
    enabled: ready && isPlatform,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_CODE, () => router.push(`${base}/code`), {
    enabled: ready,
  })

  useShortcut(SHORTCUT_IDS.NAV_FUNCTION_DETAIL_SETTINGS, () => router.push(`${base}/details`), {
    enabled: ready,
  })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST, onOpenTest, { enabled: ready })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_DOWNLOAD, onOpenDownload, { enabled: ready })

  useShortcut(SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL, onCopyUrl, { enabled: ready })
}
