import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useRevealedSecret } from '@/components/interfaces/APIKeys/useRevealedSecret'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLatest } from '@/hooks/misc/useLatest'

const AUTO_HIDE_MS = 10_000
const SECRET_MASK = '••••••••••••••••••••'

export const SERVER_ENV_VARS = {
  url: 'SUPABASE_URL',
  publishableKey: 'SUPABASE_PUBLISHABLE_KEY',
  secretKey: 'SUPABASE_SECRET_KEY',
  jwksUrl: 'SUPABASE_JWKS_URL',
} as const

const JWKS_DISCOVERY_PATH = '/auth/v1/.well-known/jwks.json'

export interface ConnectServerEnvSecret {
  exists: boolean
  canReveal: boolean
  isRevealed: boolean
  isRevealing: boolean
  maskedValue: string
  displayValue: string
  toggle: () => Promise<void>
  getValue: () => Promise<string>
}

export interface UseConnectServerEnvResult {
  isLoading: boolean
  canReadAPIKeys: boolean
  apiUrl: string
  publishableKey: string

  // Public JWKS discovery endpoint, used to verify user JWTs.
  jwksUrl: string
  secret: ConnectServerEnvSecret

  // Builds the full .env text, revealing the secret key on demand.
  buildEnv: () => Promise<string>
}

export function useConnectServerEnv(): UseConnectServerEnvResult {
  const { ref: projectRef } = useParams()

  const { can: canReadAPIKeys, isLoading: isLoadingPermission } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const [isRevealed, setIsRevealed] = useState(false)
  // So async callbacks below can check the current reveal state after an
  // await, instead of the value closed over when they started.
  const isRevealedRef = useLatest(isRevealed)

  const { data: apiUrl, isPending: isLoadingUrl } = useProjectApiUrl({ projectRef })
  const resolvedUrl = apiUrl || 'your-project-url'
  const jwksUrl = apiUrl
    ? new URL(JWKS_DISCOVERY_PATH, apiUrl).href
    : `your-project-url${JWKS_DISCOVERY_PATH}`

  const { data: keys, isLoading: isLoadingKeys } = useAPIKeys(
    { projectRef },
    { enabled: canReadAPIKeys }
  )
  const publishableKey = keys?.publishableKey?.api_key ?? keys?.anonKey?.api_key ?? ''
  const secretKey = keys?.secretKey ?? keys?.serviceKey
  const isLegacySecret = !keys?.secretKey && !!keys?.serviceKey
  const maskedValue = secretKey?.api_key
    ? `${secretKey.api_key.slice(0, 15)}${SECRET_MASK}`
    : 'your-secret-key'

  const {
    data: revealedSecretApi,
    isLoading: isRevealingApi,
    reveal,
    clear,
  } = useRevealedSecret({
    projectRef,
    id: !isLegacySecret ? (secretKey?.id ?? undefined) : undefined,
  })

  const revealedSecret = isLegacySecret ? (isRevealed ? secretKey?.api_key : undefined) : revealedSecretApi
  const isRevealing = isLegacySecret ? false : isRevealingApi

  // toggle() and getSecretValue() can both decide to reveal before either
  // resolves (e.g. clicking "Reveal" and "Copy" in quick succession); share
  // one in-flight request rather than firing two and racing to set state.
  const revealPromiseRef = useRef<ReturnType<typeof reveal> | null>(null)
  const revealOnce = useCallback(() => {
    if (isLegacySecret) {
      return Promise.resolve(secretKey?.api_key)
    }
    if (!revealPromiseRef.current) {
      revealPromiseRef.current = reveal().finally(() => {
        revealPromiseRef.current = null
      })
    }
    return revealPromiseRef.current
  }, [isLegacySecret, secretKey?.api_key, reveal])

  // clear() invalidates the in-flight reveal request (by request id) but
  // doesn't know about revealPromiseRef, so a hide immediately followed by
  // another reveal would otherwise reuse that now-invalidated promise
  // instead of firing a fresh request.
  const clearReveal = useCallback(() => {
    revealPromiseRef.current = null
    clear()
  }, [clear])

  const toggle = useCallback(async () => {
    if (!secretKey || !canReadAPIKeys) return
    if (isRevealed) {
      setIsRevealed(false)
      clearReveal()
    } else {
      setIsRevealed(true)
      if (isLegacySecret) return
      try {
        await revealOnce()
      } catch (error) {
        setIsRevealed(false)
        throw new Error('Failed to reveal secret API key', { cause: error })
      }
    }
  }, [secretKey, canReadAPIKeys, isRevealed, clearReveal, isLegacySecret, revealOnce])

  const getSecretValue = useCallback(async () => {
    if (!secretKey || !canReadAPIKeys) return 'your-secret-key'
    if (isLegacySecret) return secretKey.api_key || 'your-secret-key'
    if (revealedSecret) return revealedSecret
    const value = await revealOnce()
    if (!isRevealedRef.current) clearReveal()
    return value ?? 'your-secret-key'
  }, [secretKey, canReadAPIKeys, isLegacySecret, revealedSecret, revealOnce, clearReveal])

  const buildEnv = useCallback(async () => {
    const secretValue = await getSecretValue()
    return [
      `${SERVER_ENV_VARS.url}=${resolvedUrl}`,
      `${SERVER_ENV_VARS.publishableKey}=${publishableKey || 'your-publishable-key'}`,
      `${SERVER_ENV_VARS.secretKey}=${secretValue}`,
      `${SERVER_ENV_VARS.jwksUrl}=${jwksUrl}`,
    ].join('\n')
  }, [resolvedUrl, publishableKey, jwksUrl, getSecretValue])

  useEffect(() => {
    if (!isRevealed) return
    if (!isLegacySecret && !revealedSecret) return
    const timer = setTimeout(() => {
      setIsRevealed(false)
      clearReveal()
    }, AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [isRevealed, isLegacySecret, revealedSecret, clearReveal])

  useEffect(() => {
    setIsRevealed(false)
    clearReveal()
  }, [projectRef, secretKey?.id, clearReveal])


  return {
    isLoading: isLoadingUrl || isLoadingKeys || isLoadingPermission,
    canReadAPIKeys,
    apiUrl: resolvedUrl,
    publishableKey: publishableKey || 'your-publishable-key',
    jwksUrl,
    secret: {
      exists: !!secretKey,
      canReveal: canReadAPIKeys,
      isRevealed,
      isRevealing,
      maskedValue,
      displayValue: isRevealed
        ? (isLegacySecret ? (secretKey?.api_key ?? maskedValue) : (revealedSecret ?? maskedValue))
        : maskedValue,
      toggle,
      getValue: getSecretValue,
    },
    buildEnv,
  }
}
