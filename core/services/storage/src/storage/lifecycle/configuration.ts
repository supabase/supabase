import { createHash } from 'node:crypto'
import { hasInvalidXmlCharacters } from '@internal/xml'
import stringify from 'safe-stable-stringify'
import {
  type BucketLifecycleConfiguration,
  LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS,
  LIFECYCLE_MAX_NONCURRENT_DAYS,
  LIFECYCLE_MAX_RULES,
  type LifecycleEvaluationRule,
  type LifecycleRule,
} from '../schemas/lifecycle'

type ValidationCategory = 'MALFORMED_XML' | 'INVALID_ARGUMENT' | 'INVALID_REQUEST'

const INVALID_NONCURRENT_DAYS_MESSAGE =
  "'NoncurrentDays' for NoncurrentVersionExpiration action must be a positive integer"
const INVALID_NEWER_NONCURRENT_VERSIONS_MESSAGE =
  "'NewerNoncurrentVersions' for NoncurrentVersionExpiration action must be an integer between 1 and 100"
const S3_FILTER_ELEMENTS = new Set([
  'And',
  'ObjectSizeGreaterThan',
  'ObjectSizeLessThan',
  'Prefix',
  'Tag',
])
const S3_UNSUPPORTED_RULE_ELEMENTS = new Set([
  'AbortIncompleteMultipartUpload',
  'Expiration',
  'NoncurrentVersionTransition',
  'Prefix',
  'Transition',
])

interface RuleShape {
  id: string
  status: string
  filter: string
  expiration: string
}

const CANONICAL_RULE_SHAPE: RuleShape = {
  id: 'id',
  status: 'status',
  filter: 'filter',
  expiration: 'noncurrentVersionExpiration',
}

const S3_RULE_SHAPE: RuleShape = {
  id: 'ID',
  status: 'Status',
  filter: 'Filter',
  expiration: 'NoncurrentVersionExpiration',
}

const CANONICAL_RULE_KEYS = Object.values(CANONICAL_RULE_SHAPE)
const S3_RULE_KEYS = [...Object.values(S3_RULE_SHAPE), '$']

export class LifecycleConfigurationValidationError extends Error {
  constructor(
    message: string,
    public readonly category: ValidationCategory = 'MALFORMED_XML'
  ) {
    super(message)
    this.name = 'LifecycleConfigurationValidationError'
  }
}

export function normalizeLifecycleConfiguration(input: unknown): BucketLifecycleConfiguration {
  const configuration = requireRecord(input, 'Lifecycle configuration must be an object')
  assertOnlyKeys(configuration, ['rules'], 'Lifecycle configuration')
  return normalizeRules(
    requireArray(configuration.rules, 'Lifecycle configuration rules must be an array'),
    normalizeCanonicalRule
  )
}

export function normalizeS3LifecycleConfiguration(input: unknown): BucketLifecycleConfiguration {
  const root = requireRecord(input, 'Lifecycle configuration must be an object')
  assertOnlyKeys(root, ['LifecycleConfiguration'], 'Lifecycle configuration')
  const configuration = requireRecord(
    root.LifecycleConfiguration,
    'LifecycleConfiguration must be an object'
  )
  assertOnlyKeys(configuration, ['Rule', '$'], 'LifecycleConfiguration')
  assertS3NamespaceAttributes(configuration.$, 'LifecycleConfiguration')
  return normalizeRules(
    requireArray(configuration.Rule, 'LifecycleConfiguration Rule must be an array'),
    normalizeS3Rule
  )
}

export function lifecycleConfigurationToS3(
  configuration: BucketLifecycleConfiguration
): Record<string, unknown> {
  return {
    LifecycleConfiguration: {
      Rule: configuration.rules.map((rule) => ({
        ...(rule.id === undefined ? {} : { ID: rule.id }),
        Status: rule.status,
        Filter: '',
        NoncurrentVersionExpiration: {
          NoncurrentDays: rule.noncurrentVersionExpiration.noncurrentDays,
          ...(rule.noncurrentVersionExpiration.newerNoncurrentVersions === undefined
            ? {}
            : {
                NewerNoncurrentVersions: rule.noncurrentVersionExpiration.newerNoncurrentVersions,
              }),
        },
      })),
    },
  }
}

export function hasEnabledLifecycleRule(configuration: BucketLifecycleConfiguration): boolean {
  return configuration.rules.some((rule) => rule.status === 'Enabled')
}

export function compileLifecycleEvaluationRules(
  configuration: BucketLifecycleConfiguration,
  snapshotAt: Date
): LifecycleEvaluationRule[] {
  assertValidDate(snapshotAt, 'snapshotAt')

  const compiled = configuration.rules
    .filter((rule) => rule.status === 'Enabled')
    .map((rule) => {
      const { noncurrentDays, newerNoncurrentVersions } = rule.noncurrentVersionExpiration
      if (newerNoncurrentVersions !== undefined) {
        assertIntegerInRange(
          newerNoncurrentVersions,
          1,
          LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS,
          'NewerNoncurrentVersions'
        )
      }
      return {
        cutoffAt: noncurrentCutoffAt(snapshotAt, noncurrentDays),
        ...(newerNoncurrentVersions === undefined ? {} : { newerNoncurrentVersions }),
      }
    })

  const cutoffTimes = compiled.map((rule) => lifecycleCutoffTime(rule.cutoffAt))
  return compiled.filter((rule, index) => {
    const count = rule.newerNoncurrentVersions ?? 0
    return !compiled.some((candidate, candidateIndex) => {
      if (candidateIndex === index) return false
      const candidateCount = candidate.newerNoncurrentVersions ?? 0
      const candidateTime = cutoffTimes[candidateIndex]
      const ruleTime = cutoffTimes[index]
      const candidateDominates = candidateTime >= ruleTime && candidateCount <= count
      const strictlyDominates =
        candidateTime > ruleTime || candidateCount < count || candidateIndex < index
      return candidateDominates && strictlyDominates
    })
  })
}

export function noncurrentCutoffAt(snapshotAt: Date, noncurrentDays: number): string {
  assertValidDate(snapshotAt, 'snapshotAt')
  assertIntegerInRange(noncurrentDays, 1, Number.MAX_SAFE_INTEGER, 'NoncurrentDays')

  const dayMs = 86_400_000
  const cutoffDay = Math.floor(snapshotAt.getTime() / dayMs) - noncurrentDays
  // PostgreSQL timestamps start at Julian day zero, 2,440,588 days before the Unix epoch.
  // A strict cutoff at or before that boundary matches no finite timestamp.
  // Represent it as an empty cutoff without serializing a BC Date.
  if (cutoffDay <= -2_440_588) return '-infinity'
  return new Date(cutoffDay * dayMs).toISOString()
}

export function lifecycleCutoffTime(value: string): number {
  return value === '-infinity' ? Number.NEGATIVE_INFINITY : Date.parse(value)
}

export function lifecycleConfigurationsEqual(
  left: BucketLifecycleConfiguration | null,
  right: BucketLifecycleConfiguration
): boolean {
  if (left === null || left.rules.length !== right.rules.length) {
    return false
  }

  const rightRulesById = new Map(right.rules.map((rule) => [rule.id, rule]))
  return left.rules.every((rule) => {
    const candidate = rightRulesById.get(rule.id)
    return candidate !== undefined && lifecycleRulesEqual(rule, candidate)
  })
}

function lifecycleRulesEqual(left: LifecycleRule, right: LifecycleRule): boolean {
  return (
    left.status === right.status &&
    left.noncurrentVersionExpiration.noncurrentDays ===
      right.noncurrentVersionExpiration.noncurrentDays &&
    left.noncurrentVersionExpiration.newerNoncurrentVersions ===
      right.noncurrentVersionExpiration.newerNoncurrentVersions
  )
}

function normalizeRules(
  rawRules: unknown[],
  normalize: (value: unknown, index: number) => LifecycleRule
): BucketLifecycleConfiguration {
  validateRuleCount(rawRules)
  const rules = assignGeneratedRuleIds(rawRules.map(normalize))
  validateUniqueRuleIds(rules)
  return { rules }
}

function normalizeCanonicalRule(value: unknown, index: number): LifecycleRule {
  const rule = requireRecord(value, `Rule ${index + 1} must be an object`)
  assertOnlyKeys(rule, CANONICAL_RULE_KEYS, `Rule ${index + 1}`)
  return normalizeRule(rule, index, CANONICAL_RULE_SHAPE)
}

function normalizeS3Rule(value: unknown, index: number): LifecycleRule {
  const rule = requireRecord(value, `Rule ${index + 1} must be an object`)
  const unknownKeys = Object.keys(rule).filter((key) => !S3_RULE_KEYS.includes(key))

  if (unknownKeys.length > 0) {
    const category = unknownKeys.every((key) => S3_UNSUPPORTED_RULE_ELEMENTS.has(key))
      ? 'INVALID_REQUEST'
      : 'MALFORMED_XML'
    const hint = unknownKeys[0] === 'Prefix' ? '; use Filter instead' : ''
    throw validationError(
      `Rule ${index + 1} contains unsupported element ${unknownKeys[0]}${hint}`,
      category
    )
  }

  assertS3NamespaceAttributes(rule.$, `Rule ${index + 1}`)

  if (!Object.hasOwn(rule, S3_RULE_SHAPE.expiration)) {
    throw validationError(
      `Rule ${index + 1} must contain NoncurrentVersionExpiration`,
      'INVALID_REQUEST'
    )
  }

  return normalizeRule(rule, index, S3_RULE_SHAPE, true)
}

function normalizeRule(
  rule: Record<string, unknown>,
  index: number,
  shape: RuleShape,
  s3Shape = false
): LifecycleRule {
  if (!Object.hasOwn(rule, shape.filter)) {
    throw validationError(`Rule ${index + 1} must contain ${shape.filter}`)
  }
  const id = optionalRuleId(rule[shape.id], index)
  const status = normalizeStatus(rule[shape.status], index)
  const expirationInput = rule[shape.expiration]
  const expiration = normalizeExpiration(expirationInput, index, s3Shape)
  const filter = normalizeFilter(rule[shape.filter], index, s3Shape)

  return {
    ...(id === undefined ? {} : { id }),
    status,
    filter,
    noncurrentVersionExpiration: expiration,
  }
}

function normalizeStatus(value: unknown, index: number): LifecycleRule['status'] {
  if (value !== 'Enabled' && value !== 'Disabled') {
    throw validationError(`Rule ${index + 1} Status must be Enabled or Disabled`)
  }
  return value
}

function normalizeFilter(value: unknown, index: number, s3Shape: boolean): Record<string, never> {
  if (value === '') return {}
  const filterKey = (s3Shape ? S3_RULE_SHAPE : CANONICAL_RULE_SHAPE).filter
  const filter = requireRecord(value, `Rule ${index + 1} ${filterKey} must be an object`)
  const keys = Object.keys(filter)
  if (keys.length === 0) return {}
  if (keys.length === 1 && filter[s3Shape ? 'Prefix' : 'prefix'] === '') return {}

  throw validationError(
    `Rule ${index + 1} uses a lifecycle filter that is not supported in v1`,
    s3Shape && keys.length === 1 && S3_FILTER_ELEMENTS.has(keys[0])
      ? 'INVALID_REQUEST'
      : 'MALFORMED_XML'
  )
}

function normalizeExpiration(value: unknown, index: number, s3Shape: boolean) {
  const expirationKey = (s3Shape ? S3_RULE_SHAPE : CANONICAL_RULE_SHAPE).expiration
  const expiration = requireRecord(value, `Rule ${index + 1} ${expirationKey} must be an object`)
  const daysKey = s3Shape ? 'NoncurrentDays' : 'noncurrentDays'
  const newerKey = s3Shape ? 'NewerNoncurrentVersions' : 'newerNoncurrentVersions'
  assertOnlyKeys(expiration, [daysKey, newerKey], `Rule ${index + 1} expiration`)

  if (!Object.hasOwn(expiration, daysKey)) {
    throw validationError(`Rule ${index + 1} ${expirationKey} must contain ${daysKey}`)
  }

  const noncurrentDays = parseIntegerArgument(expiration[daysKey], INVALID_NONCURRENT_DAYS_MESSAGE)
  if (noncurrentDays < 1) {
    throw validationError(INVALID_NONCURRENT_DAYS_MESSAGE, 'INVALID_ARGUMENT')
  }
  if (noncurrentDays > LIFECYCLE_MAX_NONCURRENT_DAYS) {
    throw validationError(
      `The integer value must be less than or equal to ${LIFECYCLE_MAX_NONCURRENT_DAYS}.`,
      'INVALID_ARGUMENT'
    )
  }

  const rawNewer = expiration[newerKey]
  if (rawNewer === undefined) return { noncurrentDays }

  const newerNoncurrentVersions = parseIntegerArgument(
    rawNewer,
    INVALID_NEWER_NONCURRENT_VERSIONS_MESSAGE
  )
  if (
    newerNoncurrentVersions < 1 ||
    newerNoncurrentVersions > LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS
  ) {
    throw validationError(INVALID_NEWER_NONCURRENT_VERSIONS_MESSAGE, 'INVALID_ARGUMENT')
  }
  return { noncurrentDays, newerNoncurrentVersions }
}

function optionalRuleId(value: unknown, index: number): string | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string') {
    throw validationError(`Rule ${index + 1} ID must be a string`)
  }
  // AWS S3 counts UTF-16 code units, which matches JavaScript string.length.
  if (value.length > 255) {
    throw validationError(
      `Rule ${index + 1} ID must be 255 characters or fewer`,
      'INVALID_ARGUMENT'
    )
  }
  // Rule IDs written through REST must also round-trip through S3 XML.
  if (hasInvalidXmlCharacters(value)) {
    throw validationError(
      `Rule ${index + 1} ID must contain only valid XML 1.0 characters`,
      'INVALID_ARGUMENT'
    )
  }
  return value
}

type IdentifiedLifecycleRule = LifecycleRule & { id: string }

function assignGeneratedRuleIds(rules: LifecycleRule[]): IdentifiedLifecycleRule[] {
  const usedIds = new Set(rules.flatMap((rule) => (rule.id === undefined ? [] : [rule.id])))
  const nextSuffixByBase = new Map<string, number>()
  return rules.map((rule) => {
    if (rule.id !== undefined) return { ...rule, id: rule.id }

    const content = lifecycleRuleContent(rule)
    const base = `rule-${createHash('sha256').update(content).digest('hex')}`
    let collision = nextSuffixByBase.get(base) ?? 0
    let id = collision === 0 ? base : `${base}-${collision}`
    while (usedIds.has(id)) {
      collision += 1
      id = `${base}-${collision}`
    }
    usedIds.add(id)
    nextSuffixByBase.set(base, collision + 1)
    return { ...rule, id }
  })
}

function lifecycleRuleContent(rule: LifecycleRule): string {
  const { id: _id, ...content } = rule
  return stringify(content)
}

function validateRuleCount(rules: unknown[]) {
  if (rules.length < 1 || rules.length > LIFECYCLE_MAX_RULES) {
    throw validationError(
      `Lifecycle configuration must contain between 1 and ${LIFECYCLE_MAX_RULES} rules`
    )
  }
}

function validateUniqueRuleIds(rules: IdentifiedLifecycleRule[]) {
  const ids = new Set<string>()
  for (const rule of rules) {
    if (ids.has(rule.id)) {
      throw validationError(
        'Rule ID must be unique. Found same ID for more than one rule',
        'INVALID_ARGUMENT'
      )
    }
    ids.add(rule.id)
  }
}

function parseIntegerArgument(value: unknown, message: string): number {
  const digits = typeof value === 'string' ? value.trim() : value
  const parsed =
    typeof digits === 'number'
      ? digits
      : typeof digits === 'string' && /^\d+$/.test(digits)
        ? Number(digits)
        : Number.NaN
  if (!Number.isSafeInteger(parsed)) {
    throw validationError(message, 'INVALID_ARGUMENT')
  }
  return parsed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function assertIntegerInRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw validationError(`${label} must be between ${minimum} and ${maximum}`)
  }
}

function assertValidDate(value: Date, label: string) {
  if (Number.isNaN(value.getTime())) {
    throw validationError(`${label} must be a valid date`)
  }
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) throw validationError(message)
  return value
}

function requireArray(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw validationError(message)
  return value
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key))
  if (unknown !== undefined) {
    throw validationError(`${label} contains unsupported field ${unknown}`)
  }
}

function assertS3NamespaceAttributes(value: unknown, label: string) {
  if (value === undefined) return
  const attributes = requireRecord(value, `${label} attributes must be an object`)
  assertOnlyKeys(attributes, ['xmlns'], `${label} attributes`)
  if (attributes.xmlns !== 'http://s3.amazonaws.com/doc/2006-03-01/') {
    throw validationError(`${label} has an invalid XML namespace`)
  }
}

function validationError(message: string, category?: ValidationCategory) {
  return new LifecycleConfigurationValidationError(message, category)
}
