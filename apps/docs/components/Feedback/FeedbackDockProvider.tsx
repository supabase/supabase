'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BASE_PATH, IS_PLATFORM } from '~/lib/constants'
import { isFeatureEnabled, useConstant, type Database } from 'common'
import dynamic from 'next/dynamic'
import {
  createContext,
  use,
  useReducer,
  useRef,
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
} from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { focusCommentEditor } from './comment-editor.utils'
import {
  feedbackDockReducer,
  INITIAL_FEEDBACK_DOCK_STATE,
  type FeedbackDockAction,
  type FeedbackDockState,
  type FeedbackTargetPage,
} from './feedback-dock.reducer'
import type { FeedbackImage } from './feedback-images.utils'
import type { FeedbackPin, FeedbackVote } from './feedback-schema'
import { getSanitizedTabParams } from './Feedback.utils'
import { useSendDocsFeedback } from './useSendDocsFeedback'

interface FeedbackDockActions {
  openDock: (args: {
    vote: FeedbackVote
    page: FeedbackTargetPage
    opener?: HTMLElement | null
  }) => void
  closeDock: () => void
  setComment: (comment: string) => void
  addPin: (pin: FeedbackPin) => void
  removePin: (index: number) => void
  addImages: (images: FeedbackImage[]) => void
  removeImage: (path: string) => void
  setPicking: (isPicking: boolean) => void
  sendMore: () => void
}

interface FeedbackDockContextValue {
  state: FeedbackDockState
  actions: FeedbackDockActions
  dockRef: RefObject<HTMLElement | null>
  editorRef: RefObject<HTMLDivElement | null>
  openerRef: RefObject<HTMLElement | null>
  canSubmit: boolean
  isEnabled: boolean
  send: () => void
}

const FeedbackDock = dynamic(() => import('./FeedbackDock').then((mod) => mod.FeedbackDock), {
  ssr: false,
})

const ElementPicker = dynamic(() => import('./ElementPicker').then((mod) => mod.ElementPicker), {
  ssr: false,
})

const FeedbackDockContext = createContext<FeedbackDockContextValue | null>(null)

const createFeedbackClient = (): SupabaseClient<Database> | undefined => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return IS_PLATFORM && supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : undefined
}

const createActions = ({
  dispatch,
  dockRef,
  editorRef,
  openerRef,
}: {
  dispatch: Dispatch<FeedbackDockAction>
  dockRef: RefObject<HTMLElement | null>
  editorRef: RefObject<HTMLDivElement | null>
  openerRef: RefObject<HTMLElement | null>
}): FeedbackDockActions => ({
  openDock: ({ vote, page, opener }) => {
    const target = opener ?? document.activeElement
    if (
      target instanceof HTMLElement &&
      target !== document.body &&
      !dockRef.current?.contains(target)
    ) {
      openerRef.current = target
    }
    dispatch({ type: 'openDock', vote, page })
    // a repeat vote finds the editor mounted, a first open focuses it on mount
    focusCommentEditor(editorRef.current)
  },
  closeDock: () => dispatch({ type: 'closeDock' }),
  setComment: (comment) => dispatch({ type: 'setComment', comment }),
  addPin: (pin) => dispatch({ type: 'addPin', pin }),
  removePin: (index) => dispatch({ type: 'removePin', index }),
  addImages: (images) => dispatch({ type: 'addImages', images }),
  removeImage: (path) => dispatch({ type: 'removeImage', path }),
  setPicking: (isPicking) => dispatch({ type: 'setPicking', isPicking }),
  sendMore: () => dispatch({ type: 'sendMore' }),
})

const renderNothing = () => null

export const useFeedbackDock = (): FeedbackDockContextValue => {
  const context = use(FeedbackDockContext)
  if (!context) throw new Error('useFeedbackDock must be used inside FeedbackDockProvider')
  return context
}

export const FeedbackDockProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(feedbackDockReducer, INITIAL_FEEDBACK_DOCK_STATE)
  const client = useConstant(createFeedbackClient)
  const dockRef = useRef<HTMLElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement>(null)
  const actions = useConstant(() => createActions({ dispatch, dockRef, editorRef, openerRef }))
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

  const handleDockError = () => dispatch({ type: 'closeDock' })
  const handlePickerError = () => dispatch({ type: 'setPicking', isPicking: false })

  const value: FeedbackDockContextValue = {
    state,
    actions,
    dockRef,
    editorRef,
    openerRef,
    canSubmit: !!client,
    isEnabled: isFeatureEnabled('feedback:docs'),
    send,
  }

  return (
    <FeedbackDockContext value={value}>
      {children}
      {value.isEnabled ? (
        <ErrorBoundary
          key={String(state.isOpen)}
          fallbackRender={renderNothing}
          onError={handleDockError}
        >
          <FeedbackDock />
          {state.isPicking ? (
            <ErrorBoundary fallbackRender={renderNothing} onError={handlePickerError}>
              <ElementPicker />
            </ErrorBoundary>
          ) : null}
        </ErrorBoundary>
      ) : null}
    </FeedbackDockContext>
  )
}
