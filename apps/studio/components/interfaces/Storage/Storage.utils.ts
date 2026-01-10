import { PostgresPolicy } from '@supabase/postgres-meta'
import { difference } from 'lodash'
import { useRouter } from 'next/router'

import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { FDW } from 'data/fdw/fdws-query'
import { Bucket } from 'data/storage/buckets-query'
import { getDecryptedValues } from 'data/vault/vault-secret-decrypted-value-query'
import { createWrappedSymbol } from 'lib/helpers'
import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from './Storage.constants'
import type { StoragePolicyFormField } from './Storage.types'

const shortHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

export type PoliciesByBucket = { name: string | Symbol; policies: PostgresPolicy[] }[]

/**
 * Formats the policies from the objects table in the storage schema
 * to be consumable for the storage policies dashboard.
 *
 * @param policies All policies from a table in a schema
 */
export const formatPoliciesForStorage = (
  buckets: Bucket[],
  policies: PostgresPolicy[]
): PoliciesByBucket => {
  if (policies.length === 0) return []

  /**
   * Format policies from storage objects to:
   *  - Include bucket name
   *  - Strip away ${bucketName}_{idx} suffix
   *  - Strip away bucket_id from definitions
   *  Note, if the policy definition has no bucket_id, we skip the formatting
   */
  const formattedPolicies = formatStoragePolicies(buckets, policies)

  const policiesByBucket = groupPoliciesByBucket(formattedPolicies)
  return policiesByBucket
}

/**
 * Policy that belongs to a bucket which is not loaded yet (might not have been
 * paginated to yet, or might have been deleted)
 */
export const UNKNOWN_BUCKET_SYMBOL = createWrappedSymbol('unknown-bucket', 'Unknown')
/**
 * Policy that is not associated with a specific bucket
 */
export const UNGROUPED_POLICY_SYMBOL = createWrappedSymbol('ungrouped-policy', 'Ungrouped')

const formatStoragePolicies = (buckets: Bucket[], policies: PostgresPolicy[]) => {
  const availableBuckets = buckets.map((bucket) => bucket.name)
  const formattedPolicies = policies.map((policy) => {
    const { definition: policyDefinition, check: policyCheck } = policy

    const bucketName =
      policyDefinition !== null
        ? extractBucketNameFromDefinition(policyDefinition)
        : extractBucketNameFromDefinition(policyCheck)

    if (bucketName) {
      const isBucketLoaded = availableBuckets.includes(bucketName)

      return {
        ...policy,
        bucket: isBucketLoaded ? bucketName : UNKNOWN_BUCKET_SYMBOL,
      }
    }

    return { ...policy, bucket: UNGROUPED_POLICY_SYMBOL }
  })

  return formattedPolicies
}

export const extractBucketNameFromDefinition = (definition: string | null) => {
  if (!definition) return null

  const definitionSegments = definition?.split(' AND ') ?? []
  const [bucketDefinition] = definitionSegments.filter((segment: string) =>
    segment.includes('bucket_id')
  )
  return bucketDefinition ? bucketDefinition.split("'")[1] : null
}

const groupPoliciesByBucket = (policies: (PostgresPolicy & { bucket: string | Symbol })[]) => {
  const policiesByBucket = new Map<string | Symbol, PostgresPolicy[]>()
  policies.forEach((policy) => {
    if (!policiesByBucket.has(policy.bucket)) {
      policiesByBucket.set(policy.bucket, [])
    }
    policiesByBucket.get(policy.bucket)?.push(policy)
  })
  return Array.from(policiesByBucket).map(([bucketName, policies]) => ({
    name: bucketName,
    policies,
  }))
}

export const createPayloadsForAddPolicy = (
  bucketName = '',
  policyFormFields: StoragePolicyFormField,
  addSuffixToPolicyName = true
) => {
  const { name: policyName, definition, allowedOperations, roles } = policyFormFields
  const formattedDefinition = definition ? definition.replace(/\s+/g, ' ').trim() : ''

  return allowedOperations.map((operation: any, idx: number) => {
    return createPayloadForNewPolicy(
      idx,
      bucketName,
      policyName,
      formattedDefinition,
      operation,
      roles,
      addSuffixToPolicyName
    )
  })
}

const createPayloadForNewPolicy = (
  idx: number,
  bucketName: string,
  policyName: string,
  definition: string,
  operation: string,
  roles: string[],
  addSuffixToPolicyName: boolean
) => {
  const hashedBucketName = shortHash(bucketName)
  return {
    name: addSuffixToPolicyName ? `${policyName} ${hashedBucketName}_${idx}` : policyName,
    definition: operation === 'INSERT' ? undefined : `(${definition})`,
    action: 'PERMISSIVE',
    check: operation === 'INSERT' ? `(${definition})` : undefined,
    command: operation,
    schema: 'storage',
    table: 'objects',
    roles: roles.length > 0 ? roles : undefined,
  }
}

// Used in the policy editor to highlight which library methods are allowed depending on which operations are allowed
export const deriveAllowedClientLibraryMethods = (allowedOperations = []) => {
  return Object.keys(STORAGE_CLIENT_LIBRARY_MAPPINGS).filter((method) => {
    const requiredOperations = (STORAGE_CLIENT_LIBRARY_MAPPINGS as any)[method]
    if (difference(requiredOperations, allowedOperations).length === 0) {
      return method
    }
  })
}

// Create policy SQL statements on save based on configuration.
// Used purely for previewing in the review step, not actually fired
const createSQLStatementForCreatePolicy = (
  idx: number,
  bucketName: string,
  policyName: string,
  definition: string,
  operation: string,
  selectedRoles: string[],
  addSuffixToPolicyName: boolean
) => {
  const hashedBucketName = shortHash(bucketName)
  const formattedPolicyName = addSuffixToPolicyName
    ? `${policyName} ${hashedBucketName}_${idx}`
    : policyName
  const description = `Add policy for the ${operation} operation under the policy "${policyName}"`
  const roles = selectedRoles.length === 0 ? ['public'] : selectedRoles

  const statement = `
    CREATE POLICY "${formattedPolicyName}"
    ON storage.objects
    FOR ${operation}
    TO ${roles.join(', ')}
    ${operation === 'INSERT' ? 'WITH CHECK' : 'USING'} (${definition});
`
    .replace(/\s+/g, ' ')
    .trim()
  return { description, statement }
}

export const createSQLPolicies = (
  bucketName: string,
  policyFormFields: StoragePolicyFormField,
  addSuffixToPolicyName = true
) => {
  const { name: policyName, definition, allowedOperations, roles } = policyFormFields
  const policies = allowedOperations.map((operation: any, idx: number) =>
    createSQLStatementForCreatePolicy(
      idx,
      bucketName,
      policyName,
      definition || '',
      operation,
      roles,
      addSuffixToPolicyName
    )
  )
  return policies
}

export const applyBucketIdToTemplateDefinition = (definition: string, bucketId: any) => {
  return definition.replace('{bucket_id}', `'${bucketId}'`)
}

export const useStorageV2Page = () => {
  const router = useRouter()
  return router.pathname.split('/')[4] as undefined | 'files' | 'analytics' | 'vectors' | 's3'
}

export const getDecryptedParameters = async ({
  ref,
  connectionString,
  wrapper,
  wrapperMeta,
}: {
  ref?: string
  connectionString?: string
  wrapper: FDW
  wrapperMeta: WrapperMeta
}) => {
  const wrapperServerOptions = wrapperMeta.server.options

  const serverOptions = convertKVStringArrayToJson(wrapper?.server_options ?? [])

  const paramsToBeDecrypted = Object.fromEntries(
    new Map(
      Object.entries(serverOptions).filter(([key, value]) => {
        return wrapperServerOptions.find((option) => option.name === key)?.encrypted
      })
    )
  )

  const decryptedValues = await getDecryptedValues({
    projectRef: ref,
    connectionString: connectionString,
    ids: Object.values(paramsToBeDecrypted),
  })

  const paramsWithDecryptedValues = Object.fromEntries(
    new Map(
      Object.entries(paramsToBeDecrypted).map(([name, id]) => {
        const decryptedValue = decryptedValues[id]
        return [name, decryptedValue]
      })
    )
  )

  return {
    ...serverOptions,
    ...paramsWithDecryptedValues,
  }
}
