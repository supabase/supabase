import { ERRORS } from '@internal/errors'

/**
 * A decoded AWS POST policy document: an expiration plus a list of conditions
 * that the submitted upload form must satisfy.
 */
export interface Policy {
  expiration: string
  conditions: PolicyCondition[]
}

/**
 * An AWS POST policy condition is either:
 *  - an exact-match object with a single key: `{ "bucket": "my-bucket" }`
 *  - a tuple: `["eq", "$key", "value"]`, `["starts-with", "$key", "prefix"]`,
 *    or `["content-length-range", min, max]`
 */
export type PolicyCondition = Record<string, string> | (string | number)[]

/**
 * Submitted form fields that do NOT need to be covered by a policy condition,
 * keyed by their lowercased name. This mirrors AWS POST semantics: every other
 * field (including `key`, `bucket`, and every `x-amz-meta-*`) must be constrained
 * by a condition, otherwise a holder of a signed policy could attach arbitrary
 * uncovered fields. `file` is stripped before signature parsing; fields prefixed
 * with `x-ignore-` are AWS's documented escape hatch and are also exempt.
 */
const EXEMPT_POLICY_FIELDS = new Set([
  'policy',
  'x-amz-signature',
  'x-amz-algorithm',
  'x-amz-credential',
  'x-amz-date',
  'x-amz-security-token',
])

/**
 * Validates a POST policy `expiration`, an absolute ISO8601 timestamp (e.g.
 * `2025-01-01T00:00:00Z`). Compares it directly to the current time and never
 * relies on any client-supplied date. The expiration is required: a policy
 * without one is rejected as invalid.
 */
export function assertPolicyNotExpired(expiration: string | undefined): void {
  if (!expiration) {
    throw ERRORS.InvalidSignature('Missing policy expiration')
  }

  const expirationDate = Date.parse(expiration)
  if (isNaN(expirationDate)) {
    throw ERRORS.InvalidSignature('Invalid policy expiration')
  }

  if (expirationDate < Date.now()) {
    throw ERRORS.ExpiredSignature()
  }
}

/**
 * Evaluates the signed POST policy conditions against the values the client
 * actually submitted, in a single pass. Throws if any condition is not
 * satisfied, or if any submitted field is not covered by a condition (see
 * {@link EXEMPT_POLICY_FIELDS}).
 *
 * The `bucket` value is taken from the request target (the URL), since AWS POST
 * uploads carry the bucket in the path rather than as a form field.
 *
 * @param policy the decoded policy document
 * @param submittedFields the submitted form fields, keyed by lowercased name
 * @param bucket the bucket resolved from the request path
 */
export function assertPolicyConditionsSatisfied(
  policy: Policy,
  submittedFields: Record<string, string>,
  bucket?: string
): void {
  const conditions = policy?.conditions
  if (!Array.isArray(conditions)) {
    throw ERRORS.InvalidSignature('Invalid policy conditions')
  }

  const fields: Record<string, string> = { ...submittedFields }
  if (bucket !== undefined) {
    fields['bucket'] = bucket
  }

  const coveredFields = new Set<string>()
  for (const condition of conditions) {
    const field = evaluatePolicyCondition(condition, fields)
    if (field) {
      coveredFields.add(field)
    }
  }

  // Every submitted field must be constrained by a condition
  for (const field of Object.keys(fields)) {
    if (EXEMPT_POLICY_FIELDS.has(field) || field.startsWith('x-ignore-')) {
      continue
    }
    if (!coveredFields.has(field)) {
      throw ERRORS.AccessDenied(
        `Policy condition failed: field "${field}" is not covered by the policy`
      )
    }
  }
}

function evaluatePolicyCondition(
  condition: PolicyCondition,
  fields: Record<string, string>
): string | undefined {
  // Exact-match object form: { "field": "value" } with exactly one key.
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    const keys = Object.keys(condition)
    if (keys.length !== 1) {
      throw ERRORS.InvalidSignature('Invalid policy condition')
    }
    const field = keys[0].toLowerCase()
    assertFieldEquals(field, condition[keys[0]], fields)
    return field
  }

  // Tuple form: ["eq" | "starts-with", "$field", value] or
  // ["content-length-range", min, max].
  if (Array.isArray(condition)) {
    const [operator, target, value] = condition

    // Constrains the uploaded file rather than a form field, so it is only
    // validated here; the upload enforces it (see getContentLengthRange).
    if (isContentLengthRange(operator)) {
      parseContentLengthRange(condition)
      return undefined
    }

    if ((operator === 'eq' || operator === 'starts-with') && typeof target === 'string') {
      if (!target.startsWith('$')) {
        throw ERRORS.InvalidSignature('Invalid policy condition')
      }
      const field = target.slice(1).toLowerCase()
      if (operator === 'eq') {
        assertFieldEquals(field, value, fields)
      } else {
        assertFieldStartsWith(field, value, fields)
      }
      return field
    }
  }

  throw ERRORS.InvalidSignature('Unsupported policy condition')
}

function assertFieldEquals(
  field: string,
  expected: string | number,
  fields: Record<string, string>
): void {
  const actual = fields[field]
  if (actual === undefined || actual !== String(expected)) {
    throw ERRORS.AccessDenied(`Policy condition failed: "${field}" does not match`)
  }
}

function splitContentTypeList(value: string): string[] {
  let end = value.length
  while (end > 0 && value[end - 1] === ',') {
    end--
  }
  return value.slice(0, end).split(',')
}

function assertFieldStartsWith(
  field: string,
  prefix: string | number,
  fields: Record<string, string>
): void {
  const actual = fields[field]
  const expectedPrefix = String(prefix ?? '')
  const doesNotMatch =
    actual === undefined ||
    (field === 'content-type'
      ? splitContentTypeList(actual).some((value) => !value.trim().startsWith(expectedPrefix))
      : !actual.startsWith(expectedPrefix))

  if (doesNotMatch) {
    throw ERRORS.AccessDenied(`Policy condition failed: "${field}" does not start with "${prefix}"`)
  }
}

/**
 * The file size range, in bytes, that a POST policy allows. As on S3, the last
 * `content-length-range` condition applies when several are given. Returns
 * undefined when the policy sets no range.
 */
export function getContentLengthRange(policy: Policy): { min: number; max: number } | undefined {
  let range: { min: number; max: number } | undefined

  for (const condition of policy.conditions) {
    if (Array.isArray(condition) && isContentLengthRange(condition[0])) {
      range = parseContentLengthRange(condition)
    }
  }

  return range
}

function isContentLengthRange(operator: unknown): boolean {
  return typeof operator === 'string' && operator.toLowerCase() === 'content-length-range'
}

function parseContentLengthRange(condition: (string | number)[]): { min: number; max: number } {
  const [min, max] = condition.slice(1).map(toBound)
  if (
    condition.length !== 3 ||
    min === undefined ||
    max === undefined ||
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min < 0 ||
    min > max
  ) {
    throw ERRORS.InvalidSignature('Invalid content-length-range condition')
  }
  return { min, max }
}

// S3 accepts bounds given as strings of digits.
function toBound(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : undefined
}

export function parsePolicy(encoded: string): Policy {
  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))

    if (!value || typeof value !== 'object') {
      throw new Error()
    }

    return value as Policy
  } catch {
    throw ERRORS.InvalidSignature('Invalid POST policy')
  }
}
