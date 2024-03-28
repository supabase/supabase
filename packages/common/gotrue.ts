import { AuthClient, navigatorLock } from '@supabase/auth-js'

export const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'supabase.dashboard.auth.token'
export const AUTH_DEBUG_KEY =
  process.env.NEXT_PUBLIC_AUTH_DEBUG_KEY || 'supabase.dashboard.auth.debug'
export const AUTH_DEBUG_PERSISTED_KEY =
  process.env.NEXT_PUBLIC_AUTH_DEBUG_PERSISTED_KEY || 'supabase.dashboard.auth.debug.persist'
export const AUTH_NAVIGATOR_LOCK_DISABLED_KEY =
  process.env.NEXT_PUBLIC_AUTH_NAVIGATOR_LOCK_KEY ||
  'supabase.dashboard.auth.navigatorLock.disabled'

const debug =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  globalThis?.localStorage?.getItem(AUTH_DEBUG_KEY) === 'true'

const persistedDebug =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  globalThis?.localStorage?.getItem(AUTH_DEBUG_PERSISTED_KEY) === 'true'

const shouldEnableNavigatorLock =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  !(globalThis?.localStorage?.getItem(AUTH_NAVIGATOR_LOCK_DISABLED_KEY) === 'true')

const navigatorLockEnabled = !!(shouldEnableNavigatorLock && globalThis?.navigator?.locks)

if (shouldEnableNavigatorLock && !globalThis?.navigator?.locks) {
  console.warn('This browser does not support the Navigator Locks API. Please update it.')
}

const tabId = Math.random().toString(16).substring(2)

let dbHandle = new Promise<IDBDatabase | null>((accept, _) => {
  if (!persistedDebug) {
    accept(null)
    return
  }

  const request = indexedDB.open('auth-debug-log', 1)

  request.onupgradeneeded = (event: any) => {
    const db = event?.target?.result

    if (!db) {
      return
    }

    db.createObjectStore('events', { autoIncrement: true })
  }

  request.onsuccess = (event: any) => {
    console.log('Opened persisted auth debug log IndexedDB database', tabId)
    accept(event.target.result)
  }

  request.onerror = (event: any) => {
    console.error('Failed to open persisted auth debug log IndexedDB database', event)
    accept(null)
  }
})

const logIndexedDB = (message: string, ...args: any[]) => {
  console.log(message, ...args)

  const copyArgs = structuredClone(args)

  copyArgs.forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      delete value.user
      delete value.access_token
      delete value.token_type
      delete value.provider_token
    }
  })
  ;(async () => {
    try {
      const db = await dbHandle

      if (!db) {
        return
      }

      const tx = db.transaction(['events'], 'readwrite')
      tx.onerror = (event: any) => {
        console.error('Failed to write to persisted auth debug log IndexedDB database', event)
        dbHandle = Promise.resolve(null)
      }

      const events = tx.objectStore('events')

      events.add({
        m: message.replace(/^GoTrueClient@/i, ''),
        a: copyArgs,
        l: window.location.pathname,
        t: tabId,
      })
    } catch (e: any) {
      console.error('Failed to log to persisted auth debug log IndexedDB database', e)
      dbHandle = Promise.resolve(null)
    }
  })()
}

export const gotrueClient = new AuthClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL,
  storageKey: STORAGE_KEY,
  detectSessionInUrl: true,
  debug: debug ? (persistedDebug ? logIndexedDB : true) : false,
  lock: navigatorLockEnabled ? navigatorLock : undefined,
})
