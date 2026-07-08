import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useCallback, useEffect, useState } from 'react'

import { useRevealedSecret } from '@/components/interfaces/APIKeys/useRevealedSecret'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

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

  const { data: apiUrl, isPending: isLoadingUrl } = useProjectApiUrl({ projectRef })
  const { data: keys, isLoading: isLoadingKeys } = useAPIKeys(
    { projectRef },
    { enabled: canReadAPIKeys }
  )

  const canReveal = canReadAPIKeys

  const resolvedUrl = apiUrl || 'your-project-url'
  const publishableKey = keys?.publishableKey?.api_key ?? keys?.anonKey?.api_key ?? ''
  const secretKey = keys?.secretKey

  const jwksUrl = apiUrl
    ? new URL(JWKS_DISCOVERY_PATH, apiUrl).href
    : `your-project-url${JWKS_DISCOVERY_PATH}`

  const {
    data: revealedSecret,
    isLoading: isRevealing,
    reveal,
    clear,
  } = useRevealedSecret({ projectRef, id: secretKey?.id })

  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (!isRevealed || !revealedSecret) return
    const timer = setTimeout(() => {
      setIsRevealed(false)
      clear()
    }, AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [isRevealed, revealedSecret, clear])

  const maskedValue = secretKey?.api_key
    ? `${secretKey.api_key.slice(0, 15)}${SECRET_MASK}`
    : 'your-secret-key'

  const toggle = useCallback(async () => {
    if (!secretKey || !canReveal) return
    if (isRevealed) {
      setIsRevealed(false)
      clear()
    } else {
      setIsRevealed(true)
      try {
        await reveal()
      } catch {
        setIsRevealed(false)
        throw new Error('Failed to reveal secret API key')
      }
    }
  }, [secretKey, canReveal, isRevealed, clear, reveal])

  const getSecretValue = useCallback(async () => {
    if (!secretKey || !canReveal) return 'your-secret-key'
    if (revealedSecret) return revealedSecret
    const value = await reveal()
    if (!isRevealed) clear()
    return value ?? 'your-secret-key'
  }, [secretKey, canReveal, revealedSecret, reveal, isRevealed, clear])

  const buildEnv = useCallback(async () => {
    const secretValue = await getSecretValue()
    return [
      `${SERVER_ENV_VARS.url}=${resolvedUrl}`,
      `${SERVER_ENV_VARS.publishableKey}=${publishableKey || 'your-publishable-key'}`,
      `${SERVER_ENV_VARS.secretKey}=${secretValue}`,
      `${SERVER_ENV_VARS.jwksUrl}=${jwksUrl}`,
    ].join('\n')
  }, [resolvedUrl, publishableKey, jwksUrl, getSecretValue])

  return {
    isLoading: isLoadingUrl || isLoadingKeys || isLoadingPermission,
    canReadAPIKeys,
    apiUrl: resolvedUrl,
    publishableKey: publishableKey || 'your-publishable-key',
    jwksUrl,
    secret: {
      exists: !!secretKey,
      canReveal,
      isRevealed,
      isRevealing,
      maskedValue,
      displayValue: isRevealed && revealedSecret ? revealedSecret : maskedValue,
      toggle,
      getValue: getSecretValue,
    },
    buildEnv,
  }
}
