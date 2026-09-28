import { DEFAULT_DOCK_CORNER, type DockPlacement } from './corner-snap.utils'
import type { FeedbackImage } from './feedback-images.utils'
import { FEEDBACK_LIMITS, type FeedbackPin, type FeedbackVote } from './feedback-schema'

export type FeedbackSubmitStatus = 'idle' | 'sending' | 'sent' | 'error'

export type FeedbackSubmitProgress = 'idle' | 'comment_saved'

export type FeedbackSendErrorKind =
  | 'attachments_too_large'
  | 'invalid_payload'
  | 'upload_failed'
  | 'insert_failed'

export interface FeedbackDockError {
  kind: FeedbackSendErrorKind
  isOffline: boolean
}

export interface FeedbackTargetPage {
  pathname: string
}

export interface FeedbackDraft {
  comment: string
  pins: FeedbackPin[]
  images: FeedbackImage[]
}

export interface FeedbackDockState {
  isOpen: boolean
  vote: FeedbackVote | null
  targetPage: FeedbackTargetPage | null
  draft: FeedbackDraft
  isPicking: boolean
  placement: DockPlacement
  submitStatus: FeedbackSubmitStatus
  submitProgress: FeedbackSubmitProgress
  error: FeedbackDockError | null
  capNotice: 'pins' | 'images' | null
  submissionId: number
  pendingQuery: Record<string, string> | null
}

export type FeedbackDockAction =
  // placement only applies to a fresh open, so a vote switch doesn't move the dock
  | { type: 'openDock'; vote: FeedbackVote; page: FeedbackTargetPage; placement?: DockPlacement }
  | { type: 'closeDock' }
  | { type: 'setComment'; comment: string }
  | { type: 'addPin'; pin: FeedbackPin }
  | { type: 'removePin'; index: number }
  | { type: 'addImages'; images: FeedbackImage[] }
  | { type: 'removeImage'; path: string }
  | { type: 'setPicking'; isPicking: boolean }
  | { type: 'setPlacement'; placement: DockPlacement }
  | { type: 'submitStarted'; query: Record<string, string> }
  | { type: 'commentSaved'; submissionId: number }
  | { type: 'submitSucceeded'; submissionId: number }
  | { type: 'submitFailed'; submissionId: number; error: FeedbackDockError }
  | { type: 'sendMore' }

export const EMPTY_FEEDBACK_DRAFT: FeedbackDraft = { comment: '', pins: [], images: [] }

export const INITIAL_FEEDBACK_DOCK_STATE: FeedbackDockState = {
  isOpen: false,
  vote: null,
  targetPage: null,
  draft: EMPTY_FEEDBACK_DRAFT,
  isPicking: false,
  placement: DEFAULT_DOCK_CORNER,
  submitStatus: 'idle',
  submitProgress: 'idle',
  error: null,
  capNotice: null,
  submissionId: 0,
  pendingQuery: null,
}

export const feedbackDockReducer = (
  state: FeedbackDockState,
  action: FeedbackDockAction
): FeedbackDockState => {
  switch (action.type) {
    case 'openDock':
      return openDock({ state, vote: action.vote, page: action.page, placement: action.placement })
    case 'closeDock':
      return {
        ...INITIAL_FEEDBACK_DOCK_STATE,
        placement: state.placement,
        submissionId: state.submissionId,
      }
    case 'setComment':
      return { ...state, draft: { ...state.draft, comment: action.comment } }
    case 'addPin': {
      if (isSubmissionLocked(state)) return state
      if (state.draft.pins.length >= FEEDBACK_LIMITS.pins) return { ...state, capNotice: 'pins' }
      return { ...state, draft: { ...state.draft, pins: [...state.draft.pins, action.pin] } }
    }
    case 'removePin':
      return {
        ...state,
        capNotice: state.capNotice === 'pins' ? null : state.capNotice,
        draft: {
          ...state.draft,
          pins: state.draft.pins.filter((_, index) => index !== action.index),
        },
      }
    case 'addImages': {
      if (isSubmissionLocked(state)) return state
      const room = FEEDBACK_LIMITS.images - state.draft.images.length
      return {
        ...state,
        capNotice: action.images.length > room ? 'images' : state.capNotice,
        draft: {
          ...state.draft,
          images: [...state.draft.images, ...action.images.slice(0, Math.max(room, 0))],
        },
      }
    }
    case 'removeImage':
      if (isSubmissionLocked(state)) return state
      return {
        ...state,
        capNotice: state.capNotice === 'images' ? null : state.capNotice,
        draft: {
          ...state.draft,
          images: state.draft.images.filter((image) => image.path !== action.path),
        },
      }
    case 'setPicking':
      return {
        ...state,
        isPicking: action.isPicking && state.draft.pins.length < FEEDBACK_LIMITS.pins,
      }
    case 'setPlacement':
      return { ...state, placement: action.placement }
    case 'submitStarted':
      return {
        ...state,
        submitStatus: 'sending',
        error: null,
        isPicking: false,
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
        isPicking: false,
        capNotice: null,
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
        capNotice: null,
        pendingQuery: null,
      }
  }
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
  placement = state.placement,
}: {
  state: FeedbackDockState
  vote: FeedbackVote
  page: FeedbackTargetPage
  placement?: DockPlacement
}): FeedbackDockState => {
  if (!state.isOpen || state.submitStatus === 'sent') {
    return {
      ...INITIAL_FEEDBACK_DOCK_STATE,
      placement,
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
