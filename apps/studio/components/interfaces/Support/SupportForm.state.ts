import { neverGuard } from 'lib/helpers'
import type { ExtendedSupportCategories } from './Support.constants'

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
    }
  | {
      type: 'error'
      message: string
    }

export type SupportFormActions =
  | { type: 'INITIALIZE'; debugSource?: string }
  | { type: 'SUBMIT'; debugSource?: string }
  | {
      type: 'SUCCESS'
      sentProjectRef: string | undefined
      sentOrgSlug: string | undefined
      sentCategory: ExtendedSupportCategories
      debugSource?: string
    }
  | { type: 'ERROR'; message: string; debugSource?: string }
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
        }
      }
      if (action.type === 'ERROR') {
        return {
          type: 'error',
          message: action.message,
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
