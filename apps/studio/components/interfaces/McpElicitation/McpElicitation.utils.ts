import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

import { UNKNOWN_CLIENT_LABEL } from './McpElicitation.constants'
import type {
  ElicitationCopy,
  ElicitationOutcomeState,
  ElicitationProviderHint,
  ElicitationRequest,
  ElicitationState,
} from './McpElicitation.types'

dayjs.extend(relativeTime)
dayjs.extend(utc)

/**
 * Every user-visible mention of the key, project or provider resolves through
 * here so a request for any provider (or none we recognize) reads correctly.
 * Nothing below may hardcode a provider or key name.
 */

/**
 * v1 is stateless, so the link never says which client sent the user here. The
 * copy names the generic label instead of guessing.
 */
const RETURN_TO_CLIENT_STEP = `Go back to ${UNKNOWN_CLIENT_LABEL} and choose "I've completed it" to finish the tool call.`

const CLOSE_TAB_FOOTER = 'You can close this tab.'

const UNVERIFIED_KEY_FOOTER =
  "Supabase doesn't check that the key works. If a later call fails, update it in project settings."

export function getElicitationCopy(state: ElicitationOutcomeState): ElicitationCopy {
  switch (state.status) {
    case 'stored': {
      const { keyName, project } = state.request
      const savedSentence = `${keyName} is saved for ${project}.`

      if (state.timedOut) {
        return {
          title: 'Key stored',
          subtitle: `${savedSentence} This took longer than your client waits, so it may have stopped listening.`,
          calloutTitle: 'Next step',
          calloutBody:
            'Ask your agent to store the key again. It will find the saved key and finish without sending you back here.',
          footer: UNVERIFIED_KEY_FOOTER,
        }
      }

      return {
        title: 'Key stored',
        subtitle: savedSentence,
        calloutTitle: 'Next step',
        calloutBody: RETURN_TO_CLIENT_STEP,
        footer: UNVERIFIED_KEY_FOOTER,
      }
    }

    case 'already-stored':
      return {
        title: 'This key is already stored',
        subtitle: `${state.request.keyName} was saved for ${state.request.project}. Nothing further to do here.`,
        calloutTitle: 'Next step',
        calloutBody: RETURN_TO_CLIENT_STEP,
        footer: CLOSE_TAB_FOOTER,
      }

    case 'expired':
      return {
        title: 'This link has expired',
        subtitle: 'Nothing was stored. Your key is still safe where you copied it from.',
        calloutTitle: 'Next step',
        calloutBody: "Ask your agent to store your API key again. You'll get a fresh link.",
        footer: CLOSE_TAB_FOOTER,
      }

    case 'cancelled':
      return {
        title: 'This request was cancelled',
        subtitle: 'Nothing was stored.',
        calloutTitle: 'Next step',
        calloutBody: 'Ask your agent to run the tool again if you still need to store the key.',
        footer: CLOSE_TAB_FOOTER,
      }

    case 'paused':
      return {
        title: 'Storing keys is paused',
        subtitle: 'Supabase has turned this off for now. Nothing was stored.',
        calloutTitle: 'Next step',
        calloutBody: 'Try again later, or set the key in project settings instead.',
        footer: CLOSE_TAB_FOOTER,
      }

    // Deliberately reason-free: the user can't act on a status code, and the
    // only two ways in (lookup refused, write failed) have the same recovery.
    case 'error':
      return {
        title: "Couldn't complete this request",
        subtitle: 'Nothing was stored.',
        calloutTitle: 'Next step',
        calloutBody:
          'Ask your agent to run the tool again, or set the key in project settings instead.',
        footer: CLOSE_TAB_FOOTER,
      }
  }
}

/**
 * Status text for the card's live region.
 *
 * Every state swaps the whole card, so the transitions that happen without a
 * click — the queries resolving, the write landing — are otherwise silent for
 * screen readers. This announces the transition, not the card: the terminal
 * screens already read their "Next step" callout out via the `role="alert"` on
 * `Admonition`, so repeating the callout here would double up.
 *
 * The `form` and `wrong-account` strings are deliberately not their on-screen
 * headings. Reusing those would create a drift contract with copy that lives in
 * the components; the outcome states reuse `getElicitationCopy` because that is
 * already the single source for them.
 */
export function getElicitationAnnouncement(state: ElicitationState): string {
  switch (state.status) {
    case 'loading':
      return 'Loading request details'
    case 'form':
      return `Ready to save ${state.request.keyName} for ${state.request.project}`
    case 'wrong-account':
      return 'This account cannot access the request'
    default: {
      const { title, subtitle } = getElicitationCopy(state)
      return `${title}. ${subtitle}`
    }
  }
}

export function getSecretHelperText(project: string) {
  return `Stored encrypted for ${project}. Anyone with write access to this project can use it. Remove it any time from project settings.`
}

/**
 * The one place the page admits it is about to destroy something. Storing stays
 * enabled — replacing the key is usually exactly what the user came to do.
 */
export function getOverwriteWarning(request: ElicitationRequest) {
  const { existingSecret, keyName } = request
  if (existingSecret === undefined) return undefined

  const updatedAt = existingSecret.updatedAt
  const age = updatedAt === undefined ? undefined : formatSecretAge(updatedAt)

  return age === undefined
    ? `${keyName} already exists. Storing will replace it.`
    : `${keyName} already exists — updated ${age} ago. Storing will replace it.`
}

/**
 * The secrets endpoint returns either an ISO string or unix microseconds, so we
 * normalize the same way `TimestampInfo` does. `fromNow(true)` drops the suffix
 * because the caller owns the "ago".
 */
function formatSecretAge(updatedAt: string) {
  const isUnixMicro = !Number.isNaN(Number(updatedAt)) && updatedAt.length === 16
  const parsed = isUnixMicro ? dayjs.unix(Number(updatedAt) / 1000 / 1000) : dayjs.utc(updatedAt)

  return parsed.isValid() ? parsed.fromNow(true) : undefined
}

/**
 * A soft nudge, never a block — the user may legitimately hold a key we don't
 * recognize the shape of.
 */
export function getSecretPrefixWarning(
  value: string,
  providerHint: ElicitationProviderHint | undefined
) {
  const prefix = providerHint?.prefix
  if (!prefix || value.length === 0 || value.startsWith(prefix)) return undefined

  return `${providerHint.name} keys usually start with ${prefix}. You can still save this one.`
}
