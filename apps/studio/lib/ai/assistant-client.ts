import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { getAccessToken } from 'common'

import {
  getAssistantApiUrl,
  getAssistantOAuthStartUrl,
  getAssistantPublishableKey,
  getAssistantSupabaseUrl,
} from './assistant-backend'

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
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: ASSISTANT_AUTH_STORAGE_KEY,
    },
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

export async function getAssistantAccessToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Assistant auth is only available in the browser')
  }

  const supabase = getAssistantBrowserClient()
  if (!supabase) throw new Error('Assistant backend is not configured')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (isSessionValid(session)) {
    return session!.access_token
  }

  const platformAccessToken = await getAccessToken()
  if (!platformAccessToken) throw new Error('Not signed in')

  const exchanged = await exchangePlatformToken(platformAccessToken)
  const { error } = await supabase.auth.setSession({
    access_token: exchanged.access_token,
    refresh_token: exchanged.refresh_token,
  })
  if (error) throw error

  return exchanged.access_token
}

export async function startAssistantOAuth(orgSlug: string, returnTo: string): Promise<string> {
  const url = getAssistantOAuthStartUrl(orgSlug, returnTo)
  if (!url) throw new Error('Assistant API URL is not configured')

  const token = await getAssistantAccessToken()
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
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
        : `Failed to start OAuth (${response.status})`
    throw new Error(message)
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('authorize_url' in payload) ||
    typeof payload.authorize_url !== 'string'
  ) {
    throw new Error('Assistant OAuth start did not return an authorize URL')
  }

  return payload.authorize_url
}
