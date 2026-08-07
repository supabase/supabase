export interface ShouldShowManualSaveNoticeParams {
  /** Manual saving is a platform-only feature preview */
  isPlatform: boolean
  /** Whether the feature preview flags reflect loaded values rather than pre-load defaults */
  isFeaturePreviewInitialized: boolean
  /** Whether the rollout flag forces manual saving on for this user */
  isForced: boolean
  /** Whether the user explicitly enabled the manual save preview themselves */
  hasOptedIntoPreview: boolean
  isNoticeDismissed: boolean
}

/**
 * Whether to show the one-time notice explaining that snippets no longer
 * autosave.
 *
 * Everyone the rollout switches over needs telling — including users who
 * explicitly opted *out* of the preview, since the rollout overrides that
 * choice. Only users who turned manual saving on themselves already know what
 * the behavior is.
 */
export function shouldShowManualSaveNotice({
  isPlatform,
  isFeaturePreviewInitialized,
  isForced,
  hasOptedIntoPreview,
  isNoticeDismissed,
}: ShouldShowManualSaveNoticeParams): boolean {
  return (
    isPlatform &&
    isFeaturePreviewInitialized &&
    isForced &&
    !hasOptedIntoPreview &&
    !isNoticeDismissed
  )
}
