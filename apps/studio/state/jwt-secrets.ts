import { proxy, subscribe, useSnapshot } from 'valtio'
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import type { components } from 'api-types'
import { QueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

export type KeyStatus = 'in_use' | 'standby' | 'previously_used' | 'revoked'
export type JWTAlgorithm = 'HS256' | 'RS256' | 'ES256' | 'EdDSA'

export type SigningKey = components['schemas']['SigningKeyResponse']
export type SigningKeysResponse = components['schemas']['SigningKeysResponse']

export const INITIAL_SECRET_KEYS: SigningKey[] = [
  {
    id: '018e0e68-d7be-7471-9b31-45f4a2c48c03',
    status: 'in_use',
    algorithm: 'RS256',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // created 60 days ago
    updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // same as created_at since it's in_use
    public_jwk: null,
  },
]

interface JwtSecretsState {
  secretKeys: SigningKey[]
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

// Immediately save initial state and subscribe to changes
if (typeof window !== 'undefined') {
  // Save initial state right away
  window.localStorage.setItem('secretKeys', JSON.stringify(jwtSecretsState.secretKeys))

  // Subscribe to future changes
  subscribe(jwtSecretsState, () => {
    window.localStorage.setItem('secretKeys', JSON.stringify(jwtSecretsState.secretKeys))
  })
}

const createNewKey = (status: KeyStatus, algorithm: JWTAlgorithm): SigningKey => {
  // Generate a UUID v4
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

  return {
    id: uuid,
    status,
    algorithm,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    public_jwk: null,
  }
}

export const addNewStandbyKey = async (
  algorithm: JWTAlgorithm,
  queryClient?: QueryClient,
  projectRef?: string
) => {
  jwtSecretsState.actionInProgress = 'new'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

  const newKey = createNewKey('standby', algorithm)
  const existingStandbyKey = jwtSecretsState.secretKeys.find((key) => key.status === 'standby')

  if (existingStandbyKey) {
    jwtSecretsState.secretKeys = jwtSecretsState.secretKeys
      .map((key) =>
        key.id === existingStandbyKey.id ? { ...key, status: 'revoked' as const } : key
      )
      .concat(newKey)
  } else {
    jwtSecretsState.secretKeys = [...jwtSecretsState.secretKeys, newKey]
  }

  jwtSecretsState.actionInProgress = null

  if (queryClient && projectRef) {
    await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
  }
}

export const rotateKey = async (
  algorithm?: JWTAlgorithm,
  queryClient?: QueryClient,
  projectRef?: string
) => {
  jwtSecretsState.actionInProgress = 'rotate'
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

  const standbyKey = jwtSecretsState.secretKeys.find((key) => key.status === 'standby')

  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) => {
    if (key.status === 'in_use') {
      return {
        ...key,
        status: 'previously_used' as const,
        updated_at: new Date().toISOString(),
      }
    } else if (key.status === 'standby') {
      return { ...key, status: 'in_use' as const }
    }
    return key
  })

  if (!standbyKey && algorithm) {
    const newInUseKey = createNewKey('in_use', algorithm)
    jwtSecretsState.secretKeys = [...jwtSecretsState.secretKeys, newInUseKey]
  }

  jwtSecretsState.actionInProgress = null

  // Invalidate the query cache if queryClient is provided
  if (queryClient && projectRef) {
    await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
  }
}

export const deleteStandbyKey = async (queryClient?: QueryClient, projectRef?: string) => {
  jwtSecretsState.actionInProgress = 'delete'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.filter((key) => key.status !== 'standby')
  jwtSecretsState.actionInProgress = null

  if (queryClient && projectRef) {
    await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
  }
}

export const editStandbyKey = async (
  algorithm: JWTAlgorithm,
  queryClient?: QueryClient,
  projectRef?: string
) => {
  jwtSecretsState.actionInProgress = 'edit'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) =>
    key.status === 'standby' ? { ...key, algorithm, updated_at: new Date().toISOString() } : key
  )
  jwtSecretsState.actionInProgress = null

  if (queryClient && projectRef) {
    await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
  }
}

export const revokeKey = async (id: string, queryClient?: QueryClient, projectRef?: string) => {
  jwtSecretsState.actionInProgress = 'revoke'
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
  jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) =>
    key.id === id ? { ...key, status: 'revoked' as const } : key
  )
  jwtSecretsState.actionInProgress = null

  if (queryClient && projectRef) {
    await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
  }
}

export const useJwtSecrets = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const snapshot = useSnapshot(jwtSecretsState)
  return {
    secretKeys: snapshot.secretKeys,
    actionInProgress: snapshot.actionInProgress,
    addNewStandbyKey: (algorithm: JWTAlgorithm) => {
      if (typeof projectRef === 'string') {
        return addNewStandbyKey(algorithm, queryClient, projectRef)
      }
      return addNewStandbyKey(algorithm)
    },
    rotateKey: (algorithm?: JWTAlgorithm) => {
      if (typeof projectRef === 'string') {
        return rotateKey(algorithm, queryClient, projectRef)
      }
      return rotateKey(algorithm)
    },
    deleteStandbyKey: () => {
      if (typeof projectRef === 'string') {
        return deleteStandbyKey(queryClient, projectRef)
      }
      return deleteStandbyKey()
    },
    editStandbyKey: (algorithm: JWTAlgorithm) => {
      if (typeof projectRef === 'string') {
        return editStandbyKey(algorithm, queryClient, projectRef)
      }
      return editStandbyKey(algorithm)
    },
    revokeKey: (id: string) => {
      if (typeof projectRef === 'string') {
        return revokeKey(id, queryClient, projectRef)
      }
      return revokeKey(id)
    },
  }
}

// Query key factory
export const signingKeysKeys = {
  all: ['signing-keys'] as const,
  lists: () => [...signingKeysKeys.all, 'list'] as const,
  list: (projectRef: string) => [...signingKeysKeys.lists(), { projectRef }] as const,
}

export type SigningKeysVariables = {
  projectRef?: string
}

export type SigningKeysData = SigningKeysResponse

export const useSigningKeysQuery = <TData = SigningKeysData>(
  { projectRef }: SigningKeysVariables,
  { enabled = true, ...options }: UseQueryOptions<SigningKeysData, ResponseError, TData> = {}
) =>
  useQuery<SigningKeysData, ResponseError, TData>(
    signingKeysKeys.list(projectRef || ''),
    async () => {
      if (!projectRef) throw new Error('Project ref is required')
      return { keys: jwtSecretsState.secretKeys }
    },
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export type SigningKeyCreateVariables = {
  projectRef: string
  algorithm: JWTAlgorithm
  status: KeyStatus
}

export type SigningKeyCreateData = void

export const useSigningKeyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SigningKeyCreateData, ResponseError, SigningKeyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SigningKeyCreateData, ResponseError, SigningKeyCreateVariables>(
    async ({ algorithm, status }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newKey = createNewKey(status, algorithm)
      jwtSecretsState.secretKeys = [...jwtSecretsState.secretKeys, newKey]
    },
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(error, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create signing key: ${error.message}`)
        } else {
          onError(error, variables, context)
        }
      },
      ...options,
    }
  )
}

export type SigningKeyDeleteVariables = {
  projectRef?: string
  keyId: string
}

export type SigningKeyDeleteData = void

export const useSigningKeyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SigningKeyDeleteData, ResponseError, SigningKeyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SigningKeyDeleteData, ResponseError, SigningKeyDeleteVariables>(
    async ({ projectRef, keyId }) => {
      if (!projectRef) throw new Error('Project ref is required')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const keyToDelete = jwtSecretsState.secretKeys.find((key) => key.id === keyId)
      if (!keyToDelete) {
        throw new Error('Key not found')
      }
      if (keyToDelete.status === 'standby') {
        jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.filter((key) => key.id !== keyId)
      } else if (keyToDelete.status === 'previously_used') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const keyUpdatedAt = new Date(keyToDelete.updated_at)

        if (keyUpdatedAt > thirtyDaysAgo) {
          throw new Error('Previously used keys can only be revoked after 30 days')
        }

        jwtSecretsState.secretKeys = jwtSecretsState.secretKeys.map((key) =>
          key.id === keyId ? { ...key, status: 'revoked' as const } : key
        )
      } else {
        throw new Error('Only standby keys and previously used keys (after 30 days) can be revoked')
      }
    },
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        if (!projectRef) throw new Error('Project ref is required')
        await queryClient.invalidateQueries(signingKeysKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(error, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete signing key: ${error.message}`)
        } else {
          onError(error, variables, context)
        }
      },
      ...options,
    }
  )
}
