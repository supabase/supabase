import { difference } from 'lodash'
import { useRouter } from 'next/router'

import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from './Storage.constants'
import type { StoragePolicyFormField } from './Storage.types'
import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { convertKVStringArrayToJson } from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { FDW } from '@/data/fdw/fdws-query'
import { Bucket } from '@/data/storage/buckets-query'
import { getDecryptedValues } from '@/data/vault/vault-secret-decrypted-value-query'
import { createWrappedSymbol } from '@/lib/helpers'

const shortHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

export type PoliciesByBucket = { name: string | Symbol; policies: Policy[] }[]

/**
 * Formats the policies from the objects table in the storage schema
 * to be consumable for the storage policies dashboard.
 *
 * @param policies All policies from a table in a schema
 */
export const formatPoliciesForStorage = (
  buckets: Bucket[],
  policies: Policy[]
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

const formatStoragePolicies = (buckets: Bucket[], policies: Policy[]) => {
  const availableBuckets = buckets.map((bucket) => bucket.name)
  const formattedPolicies = policies.map((policy) => {
    const bucketNames = getPolicyBucketNames(policy)

    if (bucketNames.length === 0) return { ...policy, buckets: [UNGROUPED_POLICY_SYMBOL] }

    const groups = bucketNames.map((name) =>
      availableBuckets.includes(name) ? name : UNKNOWN_BUCKET_SYMBOL
    )

    return { ...policy, buckets: Array.from(new Set(groups)) }
  })

  return formattedPolicies
}

/**
 * `bucket_id = 'avatars'`, as Postgres renders a single-bucket policy. The `\b` guards keep
 * `archive_bucket_id` from reading as `bucket_id`, while still allowing a qualified
 * `o.bucket_id`. A `NOT (` prefix is captured so negated matches can be discarded.
 */
const BUCKET_ID_EQUALS_REGEX = /(NOT\s*\(\s*)?\bbucket_id\b\s*=\s*'((?:[^']|'')*)'/gi
/** `bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text])`, how Postgres renders `bucket_id in (...)`. */
const BUCKET_ID_IN_ARRAY_REGEX =
  /(NOT\s*\(\s*)?\bbucket_id\b\s*=\s*ANY\s*\(\s*ARRAY\s*\[([^\]]*)\]/gi
const QUOTED_LITERAL_REGEX = /'((?:[^']|'')*)'/g

/**
 * Constructs that let a policy keep applying outside the buckets it names: an alternative
 * satisfying branch (`OR`), a negation (`NOT`, beyond the simple `<>` we already drop), or a
 * subquery whose `bucket_id` belongs to some other table.
 */
const NON_EXCLUSIVE_CLAUSE_REGEX = /\b(?:OR|NOT|SELECT)\b/i

const unquote = (literal: string) => literal.replace(/''/g, "'")

/**
 * Collects every bucket a storage policy *references*, across both its USING (`definition`)
 * and WITH CHECK (`check`) clauses.
 *
 * Postgres normalizes policy expressions before storing them, so the shapes we read back are
 * predictable: `bucket_id in ('avatars', 'logos')` comes back as
 * `bucket_id = ANY (ARRAY['avatars'::text, 'logos'::text])`, and both that form and plain
 * equality are collected.
 *
 * Negated conditions contribute no buckets, since such a policy applies to every bucket
 * *except* the named one and attributing it there would be exactly backwards. That covers
 * both `bucket_id <> 'avatars'` and the `NOT (bucket_id = 'avatars')` form, which Postgres
 * stores verbatim rather than folding into `<>`.
 *
 * This is a lexical read of a normalized expression, not a Boolean proof: a policy may
 * reference `avatars` and still apply elsewhere. Use it to decide where a policy is *shown*;
 * for destructive actions use {@link isPolicyExclusiveToBucket}.
 */
export const getPolicyBucketNames = (policy: {
  definition: string | null
  check: string | null
}): string[] => {
  const names = [policy.definition, policy.check].flatMap((clause) => {
    if (!clause) return []

    const equality = Array.from(clause.matchAll(BUCKET_ID_EQUALS_REGEX))
      .filter(([, negation]) => !negation)
      .map(([, , name]) => unquote(name))

    const membership = Array.from(clause.matchAll(BUCKET_ID_IN_ARRAY_REGEX))
      .filter(([, negation]) => !negation)
      .flatMap(([, , array]) =>
        Array.from(array.matchAll(QUOTED_LITERAL_REGEX), (literal) => unquote(literal[1]))
      )

    return [...equality, ...membership]
  })

  return Array.from(new Set(names))
}

/**
 * Whether a policy applies to `bucketName` and to nothing else — the only case where it is
 * safe to remove the policy along with the bucket.
 *
 * Every clause the policy actually has must independently confine it to the bucket, because
 * USING and WITH CHECK govern different operations. `using (owner = auth.uid()) with check
 * (bucket_id = 'avatars')` mentions one bucket between the two, yet its USING half still
 * grants the caller access to their objects in every other bucket.
 *
 * Naming one bucket is not sufficient either: `(bucket_id = 'avatars') OR (owner =
 * auth.uid())` names only `avatars` and still reaches beyond it. Rather than parse the
 * expression, any clause carrying an `OR`, a `NOT` or a subquery is treated as
 * non-exclusive. The bias is deliberate — leaving a stale policy behind is recoverable,
 * deleting a live one is not.
 */
export const isPolicyExclusiveToBucket = (
  policy: { definition: string | null; check: string | null },
  bucketName: string
): boolean => {
  const clauses = [policy.definition, policy.check].filter((clause): clause is string => !!clause)
  if (clauses.length === 0) return false

  return clauses.every((clause) => {
    if (NON_EXCLUSIVE_CLAUSE_REGEX.test(clause)) return false

    const names = getPolicyBucketNames({ definition: clause, check: null })
    return names.length === 1 && names[0] === bucketName
  })
}

const groupPoliciesByBucket = (policies: (Policy & { buckets: (string | Symbol)[] })[]) => {
  const policiesByBucket = new Map<string | Symbol, Policy[]>()
  policies.forEach(({ buckets, ...policy }) => {
    buckets.forEach((bucket) => {
      if (!policiesByBucket.has(bucket)) {
        policiesByBucket.set(bucket, [])
      }
      policiesByBucket.get(bucket)?.push(policy)
    })
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
      Object.entries(serverOptions).filter(([key, _value]) => {
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
