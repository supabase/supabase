'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BASE_PATH, IS_PLATFORM } from '~/lib/constants'
import { isFeatureEnabled, useConstant, type Database } from 'common'
import { createContext, use, useReducer, type Dispatch, type PropsWithChildren } from 'react'

import {
  feedbackDockReducer,
  INITIAL_FEEDBACK_DOCK_STATE,
  type FeedbackDockAction,
  type FeedbackDockState,
  type FeedbackTargetPage,
} from './feedback-dock.reducer'
import type { FeedbackVote } from './feedback-schema'
import { getSanitizedTabParams } from './Feedback.utils'
import { useSendDocsFeedback } from './useSendDocsFeedback'

interface FeedbackDockActions {
  openDock: (args: { vote: FeedbackVote; page: FeedbackTargetPage }) => void
  closeDock: () => void
  setComment: (comment: string) => void
  sendMore: () => void
}

interface FeedbackDockContextValue {
  state: FeedbackDockState
  actions: FeedbackDockActions
  canSubmit: boolean
  isEnabled: boolean
  send: () => void
}

const FeedbackDockContext = createContext<FeedbackDockContextValue | null>(null)

const createFeedbackClient = (): SupabaseClient<Database> | undefined => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return IS_PLATFORM && supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : undefined
}

const createActions = (dispatch: Dispatch<FeedbackDockAction>): FeedbackDockActions => ({
  openDock: ({ vote, page }) => dispatch({ type: 'openDock', vote, page }),
  closeDock: () => dispatch({ type: 'closeDock' }),
  setComment: (comment) => dispatch({ type: 'setComment', comment }),
  sendMore: () => dispatch({ type: 'sendMore' }),
})

export const useFeedbackDock = (): FeedbackDockContextValue => {
  const context = use(FeedbackDockContext)
  if (!context) throw new Error('useFeedbackDock must be used inside FeedbackDockProvider')
  return context
}

export const FeedbackDockProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(feedbackDockReducer, INITIAL_FEEDBACK_DOCK_STATE)
  const client = useConstant(createFeedbackClient)
  const actions = useConstant(() => createActions(dispatch))
  const { mutate } = useSendDocsFeedback({ dispatch })

  const send = () => {
    if (!client || !state.vote || !state.targetPage || state.submitStatus === 'sending') return

    const query =
      state.pendingQuery ??
      (window.location.pathname === `${BASE_PATH}${state.targetPage.pathname}`
        ? getSanitizedTabParams()
        : {})
    dispatch({ type: 'submitStarted', query })
    mutate({
      client,
      vote: state.vote,
      page: state.targetPage,
      draft: state.draft,
      query,
      progress: state.submitProgress,
      submissionId: state.submissionId + 1,
    })
  }

  const value: FeedbackDockContextValue = {
    state,
    actions,
    canSubmit: !!client,
    isEnabled: isFeatureEnabled('feedback:docs'),
    send,
  }

  return <FeedbackDockContext value={value}>{children}</FeedbackDockContext>
}
