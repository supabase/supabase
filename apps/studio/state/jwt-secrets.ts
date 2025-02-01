import { proxy, subscribe, useSnapshot } from 'valtio'

export type KeyStatus = 'IN_USE' | 'STANDBY' | 'PREVIOUSLY_USED' | 'REVOKED'
export type JWTAlgorithm = 'HS256' | 'RS256' | 'ES256'

export interface SecretKey {
  id: string
  status: KeyStatus
  keyId: string
  createdAt: string
  expiresAt: string | null
  algorithm: JWTAlgorithm
  publicKey: string
  jwksUrl: string
  customSigningKey?: string
}

export const INITIAL_SECRET_KEYS: SecretKey[] = [
  {
    id: '1',
    status: 'IN_USE',
    keyId: '64532ac2',
    createdAt: '2024-07-13 09:00',
    expiresAt: null,
    algorithm: 'ES256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/jwks.json',
  },
  {
    id: '2',
    status: 'STANDBY',
    keyId: '4d3e7909',
    createdAt: '2024-07-14 10:30',
    expiresAt: null,
    algorithm: 'RS256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/standby-jwks.json',
  },
  {
    id: '3',
    status: 'PREVIOUSLY_USED',
    keyId: '9a8b7c6d',
    createdAt: '2024-07-12 08:45',
    expiresAt: '2024-08-12 08:45',
    algorithm: 'HS256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/previous-jwks.json',
  },
  {
    id: '4',
    status: 'REVOKED',
    keyId: '5e6f7g8h',
    createdAt: '2024-07-10 14:20',
    expiresAt: '2024-08-10 14:20',
    algorithm: 'ES256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/revoked-jwks.json',
  },
]

interface JwtSecretsState {
  secretKeys: SecretKey[]
  actionInProgress: string | null
}

// Get initial state from localStorage or use default
const getInitialState = () => {
  if (typeof window === 'undefined') return INITIAL_SECRET_KEYS

  const stored = window.localStorage.getItem('secretKeys')
  return stored ? JSON.parse(stored) : INITIAL_SECRET_KEYS
}

export const jwtSecretsState = proxy<JwtSecretsState>({
  secretKeys: getInitialState(),
  actionInProgress: null,
})

// Persist to localStorage on changes
if (typeof window !== 'undefined') {
  subscribe(jwtSecretsState, () => {
    window.localStorage.setItem('secretKeys', JSON.stringify(jwtSecretsState.secretKeys))
  })
}

const createNewKey = (
  status: KeyStatus,
  algorithm: JWTAlgorithm,
  customSigningKey?: string
): SecretKey => ({
  id: Date.now().toString(),
  status,
  keyId: Math.random().toString(36).substr(2, 8),
  createdAt: new Date().toISOString(),
  expiresAt:
    status === 'PREVIOUSLY_USED'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
  algorithm,
  publicKey: `-----BEGIN PUBLIC KEY-----\nNEW_KEY_CONTENT\n-----END PUBLIC KEY-----`,
  jwksUrl: `https://example.com/new-${status.toLowerCase()}-key-jwks.json`,
  ...(customSigningKey && { customSigningKey }),
})

export const addNewStandbyKey = async (algorithm: JWTAlgorithm, customSigningKey?: string) => {
  jwtSecretsState.actionInProgress = 'new'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

  const newKey = createNewKey('STANDBY', algorithm, customSigningKey)
  const existingStandbyKey = jwtSecretsState.secretKeys.find((key) => key.status === 'STANDBY')

  if (existingStandbyKey) {
    jwtSecretsState.secretKeys = jwtSecretsState.secretKeys
      .map((key) =>
        key.id === existingStandbyKey.id ? { ...key, status: 'REVOKED' as const } : key
      )
      .concat(newKey)
  } else {
    jwtSecretsState.secretKeys = [...jwtSecretsState.secretKeys, newKey]
  }

  jwtSecretsState.actionInProgress = null
}

export const rotateKey = async (algorithm?: JWTAlgorithm) => {
  jwtSecretsState.actionInProgress = 'rotate'
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

  const standbyKey = jwtSecretsState.secretKeys.find((key) => key.status === 'STANDBY')

  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) => {
    if (key.status === 'IN_USE') {
      return {
        ...key,
        status: 'PREVIOUSLY_USED' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    } else if (key.status === 'PREVIOUSLY_USED') {
      return { ...key, status: 'REVOKED' as const }
    } else if (key.status === 'STANDBY') {
      return { ...key, status: 'IN_USE' as const }
    }
    return key
  })

  if (!standbyKey && algorithm) {
    const newInUseKey = createNewKey('IN_USE', algorithm)
    jwtSecretsState.secretKeys = [...jwtSecretsState.secretKeys, newInUseKey]
  }

  jwtSecretsState.actionInProgress = null
}

export const deleteStandbyKey = async () => {
  jwtSecretsState.actionInProgress = 'delete'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.filter((key) => key.status !== 'STANDBY')
  jwtSecretsState.actionInProgress = null
}

export const editStandbyKey = async (algorithm: JWTAlgorithm, customSigningKey?: string) => {
  jwtSecretsState.actionInProgress = 'edit'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) =>
    key.status === 'STANDBY'
      ? { ...key, algorithm, customSigningKey: customSigningKey || undefined }
      : key
  )
  jwtSecretsState.actionInProgress = null
}

export const revokeKey = async (id: string) => {
  jwtSecretsState.actionInProgress = 'revoke'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) =>
    key.id === id ? { ...key, status: 'REVOKED' as const } : key
  )
  jwtSecretsState.actionInProgress = null
}

export const useJwtSecrets = () => {
  const snapshot = useSnapshot(jwtSecretsState)
  return {
    secretKeys: snapshot.secretKeys,
    actionInProgress: snapshot.actionInProgress,
    addNewStandbyKey,
    rotateKey,
    deleteStandbyKey,
    editStandbyKey,
    revokeKey,
  }
}
