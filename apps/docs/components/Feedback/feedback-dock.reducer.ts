import type { FeedbackVote } from './feedback-schema'

type FeedbackSubmitStatus = 'idle' | 'sending' | 'sent' | 'error'

export type FeedbackSubmitProgress = 'idle' | 'comment_saved'

export type FeedbackSendErrorKind = 'invalid_payload' | 'insert_failed'

export interface FeedbackDockError {
  kind: FeedbackSendErrorKind
  isOffline: boolean
}

export interface FeedbackTargetPage {
  pathname: string
}

export interface FeedbackDraft {
  comment: string
}

export interface FeedbackDockState {
  isOpen: boolean
  vote: FeedbackVote | null
  targetPage: FeedbackTargetPage | null
  draft: FeedbackDraft
  submitStatus: FeedbackSubmitStatus
  submitProgress: FeedbackSubmitProgress
  error: FeedbackDockError | null
  submissionId: number
  pendingQuery: Record<string, string> | null
}

export type FeedbackDockAction =
  | { type: 'openDock'; vote: FeedbackVote; page: FeedbackTargetPage }
  | { type: 'closeDock' }
  | { type: 'setComment'; comment: string }
  | { type: 'submitStarted'; query: Record<string, string> }
  | { type: 'commentSaved'; submissionId: number }
  | { type: 'submitSucceeded'; submissionId: number }
  | { type: 'submitFailed'; submissionId: number; error: FeedbackDockError }
  | { type: 'sendMore' }

const EMPTY_FEEDBACK_DRAFT: FeedbackDraft = { comment: '' }

export const INITIAL_FEEDBACK_DOCK_STATE: FeedbackDockState = {
  isOpen: false,
  vote: null,
  targetPage: null,
  draft: EMPTY_FEEDBACK_DRAFT,
  submitStatus: 'idle',
  submitProgress: 'idle',
  error: null,
  submissionId: 0,
  pendingQuery: null,
}

const isSubmissionLocked = (state: FeedbackDockState): boolean =>
  state.submitStatus === 'sending' || state.submitProgress === 'comment_saved'

const isCurrentSubmission = ({
  state,
  submissionId,
}: {
  state: FeedbackDockState
  submissionId: number
}): boolean => state.submitStatus === 'sending' && state.submissionId === submissionId

const openDock = ({
  state,
  vote,
  page,
}: {
  state: FeedbackDockState
  vote: FeedbackVote
  page: FeedbackTargetPage
}): FeedbackDockState => {
  if (!state.isOpen || state.submitStatus === 'sent') {
    return {
      ...INITIAL_FEEDBACK_DOCK_STATE,
      submissionId: state.submissionId,
      isOpen: true,
      vote,
      targetPage: page,
    }
  }

  const isSameTarget = state.vote === vote && state.targetPage?.pathname === page.pathname
  if (isSubmissionLocked(state) || isSameTarget) return state

  return { ...state, vote, targetPage: page, pendingQuery: null }
}

export const feedbackDockReducer = (
  state: FeedbackDockState,
  action: FeedbackDockAction
): FeedbackDockState => {
  switch (action.type) {
    case 'openDock':
      return openDock({ state, vote: action.vote, page: action.page })
    case 'closeDock':
      return { ...INITIAL_FEEDBACK_DOCK_STATE, submissionId: state.submissionId }
    case 'setComment':
      return { ...state, draft: { ...state.draft, comment: action.comment } }
    case 'submitStarted':
      return {
        ...state,
        submitStatus: 'sending',
        error: null,
        submissionId: state.submissionId + 1,
        pendingQuery: action.query,
      }
    case 'commentSaved':
      if (!isCurrentSubmission({ state, submissionId: action.submissionId })) return state
      return { ...state, submitProgress: 'comment_saved' }
    case 'submitSucceeded':
      if (!isCurrentSubmission({ state, submissionId: action.submissionId })) return state
      return {
        ...state,
        submitStatus: 'sent',
        submitProgress: 'idle',
        error: null,
        draft: EMPTY_FEEDBACK_DRAFT,
        pendingQuery: null,
      }
    case 'submitFailed':
      if (!isCurrentSubmission({ state, submissionId: action.submissionId })) return state
      return { ...state, submitStatus: 'error', error: action.error }
    case 'sendMore':
      return {
        ...state,
        draft: EMPTY_FEEDBACK_DRAFT,
        submitStatus: 'idle',
        submitProgress: 'idle',
        error: null,
        pendingQuery: null,
      }
  }
}
