import type { CapturedNetworkRequest, SessionRecordingOptions } from 'common'

/**
 * Enables session replay in Studio. Recording also requires "Record user
 * sessions" in PostHog, which www and docs share.
 */
export const IS_SESSION_REPLAY_ENABLED = process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY === 'true'

/**
 * Setting `data-ph-capture="true"` on an element opts its text in to session
 * recording. All text is opted out by default.
 */
const CAPTURE_DATASET_KEY = 'phCapture'

/**
 * Returns asterisks for all text except text inside elements marked
 * `data-ph-capture="true"`.
 */
export function maskReplayText(text: string, element?: HTMLElement): string {
  if (element?.dataset[CAPTURE_DATASET_KEY] === 'true') return text
  return '*'.repeat(text.trim().length)
}

/**
 * Strips query strings and fragments from recorded URLs, which posthog-js applies
 * to page URLs as well as network requests. Auth callbacks carry tokens in the
 * fragment.
 */
export function maskReplayNetworkRequest(request: CapturedNetworkRequest): CapturedNetworkRequest {
  if (request.name) {
    const separatorIndex = request.name.search(/[?#]/)
    if (separatorIndex !== -1) {
      request.name = request.name.slice(0, separatorIndex)
    }
  }
  return request
}

export const SESSION_REPLAY_CONFIG: SessionRecordingOptions = {
  // Match posthog-js defaults, but set here so the PostHog UI can't relax them.
  maskAllInputs: true,
  maskTextSelector: '*',
  maskTextFn: maskReplayText,
  // Keeps network capture to URL, status and timing. Overrides the PostHog UI.
  recordHeaders: false,
  recordBody: false,
  // Canvas is captured as images, which text masking can't reach.
  captureCanvas: { recordCanvas: false },
  maskCapturedNetworkRequestFn: maskReplayNetworkRequest,
}
