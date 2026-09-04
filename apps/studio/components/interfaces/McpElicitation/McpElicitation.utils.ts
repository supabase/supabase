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

export function getOverwriteWarning(request: ElicitationRequest) {
  const { existingSecret, keyName } = request
  if (existingSecret === undefined) return undefined

  const updatedAt = existingSecret.updatedAt
  const age = updatedAt === undefined ? undefined : formatSecretAge(updatedAt)

  return age === undefined
    ? `${keyName} already exists. Storing will replace it.`
    : `${keyName} already exists — updated ${age} ago. Storing will replace it.`
}

function formatSecretAge(updatedAt: string) {
  const isUnixMicro = !Number.isNaN(Number(updatedAt)) && updatedAt.length === 16
  const parsed = isUnixMicro ? dayjs.unix(Number(updatedAt) / 1000 / 1000) : dayjs.utc(updatedAt)

  return parsed.isValid() ? parsed.fromNow(true) : undefined
}

export function getSecretPrefixWarning(
  value: string,
  providerHint: ElicitationProviderHint | undefined
) {
  const prefix = providerHint?.prefix
  if (!prefix || value.length === 0 || value.startsWith(prefix)) return undefined

  return `${providerHint.name} keys usually start with ${prefix}. You can still save this one.`
}
