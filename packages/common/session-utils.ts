import { gotrueClient } from './gotrue'

/**
 * Enhanced session utilities for multi-device support
 * Addresses common issues with session management across multiple devices
 */

export interface SessionValidationResult {
  session: any | null
  isValid: boolean
  error?: Error
}

/**
 * Validates the current session and attempts recovery if needed
 * This function handles the multi-session scenario where getSession might fail
 * due to refresh token invalidation from other devices
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const { data: { session }, error } = await gotrueClient.getSession()
    
    if (error) {
      console.warn('Session validation failed, attempting refresh:', error.message)
      
      // Attempt to refresh the session
      try {
        const { data: refreshData, error: refreshError } = await gotrueClient.refreshSession()
        if (refreshError) {
          return {
            session: null,
            isValid: false,
            error: refreshError
          }
        }
        
        return {
          session: refreshData.session,
          isValid: true
        }
      } catch (refreshErr) {
        return {
          session: null,
          isValid: false,
          error: refreshErr as Error
        }
      }
    }
    
    return {
      session,
      isValid: !!session
    }
  } catch (err) {
    return {
      session: null,
      isValid: false,
      error: err as Error
    }
  }
}

/**
 * Safe sign out that defaults to local scope for multi-device compatibility
 * This prevents accidentally logging out users from all their devices
 */
export async function safeSignOut(options?: { 
  scope?: 'global' | 'local' | 'others'
  clearStorage?: boolean 
}) {
  const { scope = 'local', clearStorage = true } = options || {}
  
  try {
    const result = await gotrueClient.signOut({ scope })
    
    if (clearStorage && scope !== 'others') {
      // Clear local storage only if we're actually signing out the current session
      if (typeof window !== 'undefined') {
        // Clear Supabase-related items from localStorage
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase.') || key.includes('supabase')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    }
    
    return result
  } catch (error) {
    console.error('Sign out failed:', error)
    throw error
  }
}

/**
 * Checks if the current session is about to expire
 */
export function isSessionExpiringSoon(session: any, thresholdSeconds: number = 300): boolean {
  if (!session?.expires_at) return false
  
  const expiresAt = session.expires_at
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = expiresAt - now
  
  return timeUntilExpiry <= thresholdSeconds
}

/**
 * Gets session information including expiry status
 */
export async function getSessionInfo() {
  const { session, isValid, error } = await validateSession()
  
  if (!isValid || !session) {
    return {
      session: null,
      isValid: false,
      isExpiringSoon: false,
      error
    }
  }
  
  return {
    session,
    isValid: true,
    isExpiringSoon: isSessionExpiringSoon(session),
    sessionId: session.access_token ? extractSessionId(session.access_token) : null,
    error: null
  }
}

/**
 * Extracts session ID from JWT token for debugging multi-session issues
 */
function extractSessionId(accessToken: string): string | null {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return payload.session_id || null
  } catch {
    return null
  }
}

/**
 * Monitor for unexpected session termination (useful for debugging multi-session issues)
 */
export function monitorSessionState(callback: (event: string, session: any) => void) {
  return gotrueClient.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' && session === null) {
      console.warn('Unexpected session termination detected')
    }
    callback(event, session)
  })
} 