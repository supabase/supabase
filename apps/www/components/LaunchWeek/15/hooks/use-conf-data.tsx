import { useRouter } from 'next/router'
import { createContext, Dispatch, useContext, useEffect, useReducer } from 'react'
import type { RealtimeChannel, Session } from '@supabase/supabase-js'

/**
 * This is copy of shared use-conf-data.ts. For launch week 15 we need different ticket states.
 * To not break the existing functionality, we are creating a new context and hook.
 */

export type TicketState = 'registration' | 'ticket-visible' | 'loading' | 'ticket-loading'

export type UserTicketData = {
  id?: string
  email?: string
  username?: string
  name?: string
  ticket_number?: number
  platinum?: boolean
  golden?: boolean
  referrals?: number
  bg_image_id?: number
  role?: string
  company?: string
  location?: string
  created_at?: string
  metadata?: {
    role?: string
    company?: string
    location?: string
    hasSecretTicket?: boolean
    hasSharedSecret?: boolean
    hideAvatar?: boolean
    hideMetadata?: boolean
    theme?: string
    colors?: {
      background: string
      foreground: string
    }
  }
  shared_on_twitter?: string
  shared_on_linkedin?: string
  secret?: boolean
}

type LwAction =
  | { type: 'USER_TICKET_FETCH_STARTED' }
  | { type: 'USER_TICKET_FETCH_SUCCESS'; payload: UserTicketData }
  | { type: 'USER_TICKET_FETCH_ERROR'; payload: Error }
  | { type: 'USER_TICKET_UPDATED'; payload: UserTicketData }
  | { type: 'SESSION_UPDATED'; payload: Session | null }
  | { type: 'SESSION_LOADED' }
  | { type: 'TICKET_LOADING_START' }
  | { type: 'TICKET_LOADING_SUCCESS' }
  | { type: 'TICKET_LOADING_ERROR'; payload?: Error }
  | { type: 'PARTYMODE_ENABLE'; payload: RealtimeChannel }
  | { type: 'PARTYMODE_DISABLE' }
  | { type: 'URL_PARAMS_LOADED'; payload: { referal?: string } }
  | {
      type: 'GAUGES_DATA_FETCHED'
      payload: {
        payloadSaturation?: number
        payloadFill?: number
        meetupsAmount?: number
        peopleOnline?: number
      }
    }

// Define state interface
interface LwState {
  userTicketData: UserTicketData
  ticketState: TicketState
  session: Session | null
  sessionLoaded: boolean
  userTicketDataState: 'unloaded' | 'loading' | 'error' | 'loaded'
  userTicketDataError: Error | null
  ticketLoadingState: 'unloaded' | 'loading' | 'error' | 'loaded'
  ticketVisibility: boolean
  claimFormState: 'initial' | 'visible' | 'hidden'
  partymodeStatus: 'on' | 'off'
  realtimeGaugesChannel: RealtimeChannel | null
  referal?: string
  gaugesData: {
    payloadSaturation: number | null
    payloadFill: number | null
    meetupsAmount: number | null
    peopleOnline: number | null
  } | null
  urlParamsLoaded: boolean
}

export const lwReducer = (state: LwState, action: LwAction): LwState => {
  switch (action.type) {
    case 'SESSION_UPDATED':
      return {
        ...state,
        session: action.payload,
        // Show claim form if session is not available. Form triggers authentication flow.
        claimFormState: !action.payload ? 'visible' : 'hidden',
      }
    case 'SESSION_LOADED':
      return {
        ...state,
        sessionLoaded: true,
      }
    case 'USER_TICKET_FETCH_STARTED':
      return { ...state, userTicketDataState: 'loading', userTicketDataError: null }
    case 'USER_TICKET_FETCH_SUCCESS':
      return {
        ...state,
        userTicketData: action.payload,
        ticketVisibility: action.payload !== null && state.ticketLoadingState === 'loaded',
      }
    case 'USER_TICKET_FETCH_ERROR':
      return {
        ...state,
        session: null,
        ticketState: 'registration',
        userTicketDataState: 'error',
        userTicketDataError: action.payload,
      }
    case 'USER_TICKET_UPDATED':
      return {
        ...state,
        userTicketData: action.payload,
        userTicketDataState: Boolean(action.payload.id) ? 'loaded' : 'unloaded',
        userTicketDataError: null,
      }
    case 'TICKET_LOADING_START':
      return {
        ...state,
        ticketLoadingState: 'loading',
        ticketVisibility: false,
      }
    case 'TICKET_LOADING_SUCCESS':
      return {
        ...state,
        ticketLoadingState: 'loaded',
        ticketVisibility: Boolean(state.userTicketData.id),
      }
    case 'TICKET_LOADING_ERROR':
      return {
        ...state,
        ticketLoadingState: 'error',
        ticketVisibility: false,
        claimFormState: 'visible',
      }
    case 'PARTYMODE_ENABLE': {
      return {
        ...state,
        realtimeGaugesChannel: action.payload,
        partymodeStatus: 'on',
      }
    }
    case 'PARTYMODE_DISABLE': {
      return {
        ...state,
        realtimeGaugesChannel: null,
        partymodeStatus: 'off',
      }
    }
    case 'GAUGES_DATA_FETCHED': {
      const nonNullableKeys = Object.fromEntries(
        Object.entries(action.payload).filter(([_, v]) => v !== undefined)
      ) as typeof action.payload
      const newGaugeData = state.gaugesData
        ? { ...state.gaugesData, ...nonNullableKeys }
        : {
            payloadSaturation: null,
            payloadFill: null,
            meetupsAmount: null,
            peopleOnline: null,
            ...nonNullableKeys,
          }

      return {
        ...state,
        gaugesData: newGaugeData,
      }
    }
    case 'URL_PARAMS_LOADED': {
      return { ...state, urlParamsLoaded: true, referal: action.payload.referal }
    }
    default:
      action satisfies never
      return state
  }
}

export const Lw15ConfDataContext = createContext<[LwState, Dispatch<LwAction>] | null>(null)

function takeFirst(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0]
  }

  return param ?? undefined
}

export const Lw15ConfDataProvider = ({
  children,
  initState,
}: {
  children: React.ReactNode
  initState?: Partial<LwState>
}) => {
  const { query, isReady } = useRouter()

  const providerValue = useReducer(lwReducer, {
    userTicketData: {},
    ticketState: 'loading',
    session: null,
    sessionLoaded: false,
    ticketLoadingState: 'unloaded',
    ticketVisibility: false,
    userTicketDataState: 'unloaded',
    userTicketDataError: null,
    claimFormState: 'initial',
    realtimeGaugesChannel: null,
    partymodeStatus: 'off',
    gaugesData: null,
    urlParamsLoaded: false,
    ...initState,
  })
  const [, dispatch] = providerValue

  useEffect(() => {
    if (isReady) {
      dispatch({
        type: 'URL_PARAMS_LOADED',
        payload: { referal: takeFirst(query.referal) ?? takeFirst(query.username) },
      })
    }
  }, [dispatch, isReady, query.referal, query.username])

  return (
    <Lw15ConfDataContext.Provider value={providerValue}>{children}</Lw15ConfDataContext.Provider>
  )
}

export default function useLw15ConfData() {
  const result = useContext(Lw15ConfDataContext)
  if (!result) {
    throw new Error('useLw15ConfData must be used within a Lw15ConfDataProvider')
  }
  return result
}
