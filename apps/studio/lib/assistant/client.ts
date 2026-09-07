import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { gotrueClient } from 'common'

import { getAssistantApiUrl, getAssistantPublishableKey, getAssistantSupabaseUrl } from './backend'

const ASSISTANT_AUTH_STORAGE_KEY = 'assistant-auth'
const SESSION_EXPIRY_BUFFER_MS = 30_000

type AssistantSession = Pick<Session, 'access_token' | 'refresh_token'> & {
  expires_at?: number
  expires_in?: number
}

let assistantClient: SupabaseClient | null | undefined

function getAssistantBrowserClient(): SupabaseClient | null {
  if (assistantClient !== undefined) return assistantClient

  const url = getAssistantSupabaseUrl()
  const publishableKey = getAssistantPublishableKey()
  if (!url || !publishableKey) {
    assistantClient = null
    return null
  }

  assistantClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      // getSession refreshes on an enabled request; no background traffic after flag rollback.
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: ASSISTANT_AUTH_STORAGE_KEY,
    },
  })
  gotrueClient.onAuthStateChange((_event, session) => {
    if (activeSubject && session?.user.id !== activeSubject) {
      activeSubject = undefined
      setTimeout(() => {
        void clearAssistantSession()
      }, 0)
    }
  })
  return assistantClient
}

function readSessionFromPayload(payload: unknown): AssistantSession | null {
  if (!payload || typeof payload !== 'object') return null

  const nested =
    'session' in payload && payload.session && typeof payload.session === 'object'
      ? payload.session
      : payload

  if (
    !nested ||
    typeof nested !== 'object' ||
    !('access_token' in nested) ||
    !('refresh_token' in nested) ||
    typeof nested.access_token !== 'string' ||
    typeof nested.refresh_token !== 'string'
  ) {
    return null
  }

  return {
    access_token: nested.access_token,
    refresh_token: nested.refresh_token,
    expires_at:
      'expires_at' in nested && typeof nested.expires_at === 'number'
        ? nested.expires_at
        : undefined,
    expires_in:
      'expires_in' in nested && typeof nested.expires_in === 'number'
        ? nested.expires_in
        : undefined,
  }
}

function isSessionValid(session: Pick<Session, 'access_token' | 'expires_at'> | null): boolean {
  if (!session?.access_token) return false
  if (!session.expires_at) return true
  return session.expires_at * 1000 > Date.now() + SESSION_EXPIRY_BUFFER_MS
}

async function exchangePlatformToken(platformAccessToken: string): Promise<AssistantSession> {
  const apiUrl = getAssistantApiUrl()
  if (!apiUrl) throw new Error('Assistant API URL is not configured')

  const response = await fetch(`${apiUrl}/auth/exchange`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${platformAccessToken}`,
    },
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Failed to exchange platform token (${response.status})`
    throw new Error(message)
  }

  const session = readSessionFromPayload(payload)
  if (!session) throw new Error('Assistant auth exchange did not return a session')
  return session
}

let exchange: { subject: string; promise: Promise<string> } | undefined
let activeSubject: string | undefined

async function platformSession() {
  const {
    data: { session },
  } = await gotrueClient.getSession()
  if (!session) {
    await clearAssistantSession()
    throw new Error('Not signed in')
  }
  return session
}

export async function clearAssistantSession() {
  activeSubject = undefined
  // Do not instantiate an assistant client or make worker calls when unused.
  if (assistantClient) await assistantClient.auth.signOut({ scope: 'local' })
}

export async function getAssistantRequestHeaders(): Promise<Record<string, string>> {
  const platform = await platformSession()
  const subject = platform.user.id
  const supabase = getAssistantBrowserClient()
  if (!supabase) throw new Error('Assistant backend is not configured')
  activeSubject = subject
  const {
    data: { session },
  } = await supabase.auth.getSession()
  let token: string
  if (session?.user.app_metadata.platform_user_id === subject && isSessionValid(session)) {
    token = session.access_token
  } else {
    // A previous account's exchange must settle before another can change storage.
    if (exchange && exchange.subject !== subject) await exchange.promise.catch(() => {})
    if (!exchange) {
      const promise = (async () => {
        await supabase.auth.signOut({ scope: 'local' })
        const exchanged = await exchangePlatformToken(platform.access_token)
        if ((await platformSession()).user.id !== subject || activeSubject !== subject) {
          throw new Error('Your account changed. Reopen the assistant.')
        }
        const { data, error } = await supabase.auth.setSession(exchanged)
        if (error) throw error
        if (data.user?.app_metadata.platform_user_id !== subject) {
          await clearAssistantSession()
          throw new Error('Assistant identity does not match the current account')
        }
        return exchanged.access_token
      })()
      exchange = { subject, promise }
      void promise
        .finally(() => {
          if (exchange?.promise === promise) exchange = undefined
        })
        .catch(() => {})
    }
    token = await exchange.promise
  }
  const current = await platformSession()
  if (current.user.id !== subject) throw new Error('Your account changed. Reopen the assistant.')
  return {
    Authorization: `Bearer ${token}`,
  }
}
