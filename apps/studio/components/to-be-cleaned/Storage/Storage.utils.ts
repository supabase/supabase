import { groupBy, difference } from 'lodash'
import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from './Storage.constants'
import type { StoragePolicyFormField } from 'components/interfaces/Storage/Storage.types'

const shortHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

/**
 * Formats the policies from the objects table in the storage schema
 * to be consumable for the storage policies dashboard.
 * Output: [{ bucket: <string>, policies: <Policy[]> }]
 * @param {Array} policies: All policies from a table in a schema
 */
export const formatPoliciesForStorage = (buckets: any[], policies: any[]) => {
  if (policies.length === 0) return policies

  /**
   * Format policies from storage objects to:
   *  - Include bucket name
   *  - Strip away ${bucketName}_{idx} suffix
   *  - Strip away bucket_id from definitions
   *  Note, if the policy definition has no bucket_id, we skip the formatting
   */
  const formattedPolicies = formatStoragePolicies(buckets, policies)

  /**
   * Package policies by grouping them by bucket:
   * [{ name: <string>, policies: <Policy[]> }]
   */
  const policiesByBucket = groupPoliciesByBucket(formattedPolicies)

  return policiesByBucket
}

/* Start: Internal methods to support formatPoliciesForStorage but exported for tests to cover */
const formatStoragePolicies = (buckets: any[], policies: any[]) => {
  const availableBuckets = buckets.map((bucket) => bucket.name)
  const formattedPolicies = policies.map((policy) => {
    const { definition: policyDefinition, check: policyCheck } = policy

    const bucketName =
      policyDefinition !== null
        ? extractBucketNameFromDefinition(policyDefinition)
        : extractBucketNameFromDefinition(policyCheck)

    if (bucketName && availableBuckets.includes(bucketName)) {
      // [JOSHEN TODO] We cannot override definition here anymore cause we're gonna be using the auth editor
      // const definition = policyDefinition !== null ? policyDefinition : policyCheck
      return {
        ...policy,
        bucket: bucketName,
      }
    }

    return { ...policy, bucket: 'Ungrouped' }
  })

  return formattedPolicies
}

const extractBucketNameFromDefinition = (definition: string) => {
  const definitionSegments = definition?.split(' AND ') ?? []
  const [bucketDefinition] = definitionSegments.filter((segment: string) =>
    segment.includes('bucket_id')
  )
  return bucketDefinition ? bucketDefinition.split("'")[1] : null
}

const groupPoliciesByBucket = (policies: any[]) => {
  const policiesByBucket = groupBy(policies, 'bucket')
  return Object.keys(policiesByBucket).map((bucketName) => {
    return { name: bucketName, policies: policiesByBucket[bucketName] }
  })
}

/* End: Internal methods to support formatPoliciesForStorage but exported for tests to cover */

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
