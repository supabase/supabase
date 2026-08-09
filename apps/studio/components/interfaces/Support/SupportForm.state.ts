import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { neverGuard } from '@/lib/helpers'

export type SubmittedSupportRequest = Pick<
  SupportFormValues,
  'category' | 'severity' | 'subject' | 'message' | 'affectedServices' | 'allowSupportAccess'
> & {
  organizationSlug: string | undefined
  projectRef: string | undefined
  library?: string
  dashboardLogs?: string
  // Front conversation created at submit + the thread_ref used to create it, so the
  // AI support chat can append to the same conversation if the user engages it.
  threadRef?: string
  frontConversationId?: string
}

export type SupportFormState =
  | {
      type: 'initializing'
    }
  | {
      type: 'editing'
    }
  | {
      type: 'submitting'
    }
  | {
      type: 'success'
      sentProjectRef: string | undefined
      sentOrgSlug: string | undefined
      sentCategory: ExtendedSupportCategories
      submittedRequest: SubmittedSupportRequest
    }
  | {
      type: 'error'
      message: string
      code?: number
    }

export type SupportFormActions =
  | { type: 'INITIALIZE'; debugSource?: string }
  | { type: 'SUBMIT'; debugSource?: string }
  | {
      type: 'SUCCESS'
      sentProjectRef: string | undefined
      sentOrgSlug: string | undefined
      sentCategory: ExtendedSupportCategories
      submittedRequest: SubmittedSupportRequest
      debugSource?: string
    }
  | { type: 'ERROR'; message: string; code?: number; debugSource?: string }
  | { type: 'RETURN_TO_EDITING'; debugSource?: string }

export function createInitialSupportFormState(): SupportFormState {
  return {
    type: 'initializing',
  }
}

export function supportFormReducer(
  state: SupportFormState,
  action: SupportFormActions
): SupportFormState {
  switch (state.type) {
    case 'initializing':
      if (action.type === 'INITIALIZE') {
        return { type: 'editing' }
      }
      console.warn(
        `[SupportForm > supportFormReducer] ${action.type} action not allowed in 'initializing' state`
      )
      return state
    case 'editing':
      if (action.type === 'SUBMIT') {
        return { type: 'submitting' }
      }
      console.warn(
        `[SupportForm > supportFromReducer] ${action.type} action not allowed in 'filling_out' state`
      )
      return state
    case 'submitting':
      if (action.type === 'SUCCESS') {
        return {
          type: 'success',
          sentProjectRef: action.sentProjectRef,
          sentOrgSlug: action.sentOrgSlug,
          sentCategory: action.sentCategory,
          submittedRequest: action.submittedRequest,
        }
      }
      if (action.type === 'ERROR') {
        return {
          type: 'error',
          message: action.message,
          code: action.code,
        }
      }
      console.warn(
        `[SupportForm > supportFormReducer] ${action.type} action not allowed in 'submitting' state`
      )
      return state
    case 'success':
      console.warn(`[SupportForm > supportFormReducer] ${action.type} allowed in 'success' state`)
      return state
    case 'error':
      if (action.type === 'RETURN_TO_EDITING') {
        return { type: 'editing' }
      }
      console.warn(`[SupportForm > supportFormReducer] ${action.type} allowed in 'success' state`)
      return state
    default:
      return neverGuard(state)
  }
}
