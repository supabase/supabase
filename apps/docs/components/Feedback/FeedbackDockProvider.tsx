'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BASE_PATH, IS_PLATFORM } from '~/lib/constants'
import {
  isFeatureEnabled,
  LOCAL_STORAGE_KEYS,
  safeLocalStorage,
  useConstant,
  type Database,
} from 'common'
import dynamic from 'next/dynamic'
import {
  createContext,
  use,
  useReducer,
  useState,
  type Dispatch,
  type PropsWithChildren,
} from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { parseStoredCorner, type DockPlacement } from './corner-snap.utils'
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

export interface FeedbackDockActions {
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
  setPlacement: (placement: DockPlacement) => void
  sendMore: () => void
}

export interface FeedbackOpenRequest {
  opener: HTMLElement | null
}

export interface FeedbackDockContextValue {
  state: FeedbackDockState
  actions: FeedbackDockActions
  openRequest: FeedbackOpenRequest
  canSubmit: boolean
  isEnabled: boolean
  isIslandVariant: boolean
  send: () => void
  retry: () => void
}

const DOCK_VARIANT_PARAM = 'feedback-dock'

const FeedbackDock = dynamic(() => import('./FeedbackDock').then((mod) => mod.FeedbackDock), {
  ssr: false,
})

const ElementPicker = dynamic(() => import('./ElementPicker').then((mod) => mod.ElementPicker), {
  ssr: false,
})

const FeedbackDockContext = createContext<FeedbackDockContextValue | null>(null)

export const useFeedbackDock = (): FeedbackDockContextValue => {
  const context = use(FeedbackDockContext)
  if (!context) throw new Error('useFeedbackDock must be used inside FeedbackDockProvider')
  return context
}

const getInitialState = (): FeedbackDockState => ({
  ...INITIAL_FEEDBACK_DOCK_STATE,
  placement: parseStoredCorner(safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.FEEDBACK_DOCK_CORNER)),
})

const createFeedbackClient = (): SupabaseClient<Database> | undefined => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return IS_PLATFORM && supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : undefined
}

const createActions = ({
  dispatch,
  openPlacement,
  onOpenRequest,
}: {
  dispatch: Dispatch<FeedbackDockAction>
  openPlacement: DockPlacement | undefined
  onOpenRequest: (opener: HTMLElement | null) => void
}): FeedbackDockActions => ({
  openDock: ({ vote, page, opener = null }) => {
    dispatch({ type: 'openDock', vote, page, placement: openPlacement })
    onOpenRequest(opener)
  },
  closeDock: () => dispatch({ type: 'closeDock' }),
  setComment: (comment) => dispatch({ type: 'setComment', comment }),
  addPin: (pin) => dispatch({ type: 'addPin', pin }),
  removePin: (index) => dispatch({ type: 'removePin', index }),
  addImages: (images) => dispatch({ type: 'addImages', images }),
  removeImage: (path) => dispatch({ type: 'removeImage', path }),
  setPicking: (isPicking) => dispatch({ type: 'setPicking', isPicking }),
  setPlacement: (placement) => {
    // the island is where every island-variant open starts, so only corners persist
    if (placement !== 'center') {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACK_DOCK_CORNER, placement)
    }
    dispatch({ type: 'setPlacement', placement })
  },
  sendMore: () => dispatch({ type: 'sendMore' }),
})

const getIsIslandVariant = (): boolean =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get(DOCK_VARIANT_PARAM) === 'island'

const getQueryForPage = (page: FeedbackTargetPage): Record<string, string> =>
  window.location.pathname === `${BASE_PATH}${page.pathname}` ? getSanitizedTabParams() : {}

const renderNothing = () => null

export const FeedbackDockProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(feedbackDockReducer, null, getInitialState)
  const client = useConstant(createFeedbackClient)
  const isIslandVariant = useConstant(getIsIslandVariant)
  const [openRequest, setOpenRequest] = useState<FeedbackOpenRequest>({ opener: null })
  const actions = useConstant(() =>
    createActions({
      dispatch,
      openPlacement: isIslandVariant ? 'center' : undefined,
      onOpenRequest: (opener) => setOpenRequest({ opener }),
    })
  )
  const { mutate } = useSendDocsFeedback({ dispatch })

  const send = () => {
    if (!client || !state.vote || !state.targetPage || state.submitStatus === 'sending') return

    const query = state.pendingQuery ?? getQueryForPage(state.targetPage)
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
    openRequest,
    canSubmit: !!client,
    isEnabled: isFeatureEnabled('feedback:docs'),
    isIslandVariant,
    send,
    retry: send,
  }

  return (
    <FeedbackDockContext value={value}>
      {children}
      {state.isOpen || value.isEnabled ? (
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
