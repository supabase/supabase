import type { GitHubConfigDriftField } from '@/lib/github-config-drift'
import type { GitHubConfigTarget } from '@/lib/github-config-effective'

export type TomlValueStatus = 'applied' | 'drifted' | 'inactive' | 'overridden'
export type TomlSourceLayerKind = 'base' | 'branch' | 'environment'

export interface TomlValueToken {
  lineNumber: number
  start: number
  end: number
  rawValue: string
  configPath: string
  scopeLabel: string
  description: string
  status: TomlValueStatus
  overriddenByLine?: number
  overriddenByScope?: string
  overridesLines: number[]
  overridesScopes: string[]
  dashboardValue?: unknown
}

export interface TomlSourceLine {
  lineNumber: number
  text: string
  isVisible: boolean
  layer: TomlSourceLayerKind
  value?: TomlValueToken
}

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  project_id: 'Identifies the Supabase project associated with this configuration.',
  workflow_profile: 'Selects the workflow behavior used when reconciling this configuration.',
  schema_management: 'Controls how database schema changes are represented and applied.',
  config_source: 'Declares where the desired project configuration is managed.',
  'api.schemas': 'Lists the database schemas exposed through the Data API.',
  'api.extra_search_path': 'Adds schemas to the database search path used by API requests.',
  'api.max_rows': 'Limits the number of rows returned by a single Data API request.',
  'auth.site_url': 'Sets the primary application URL used for authentication redirects.',
  'auth.additional_redirect_urls':
    'Lists the additional redirect URLs accepted after authentication.',
  'auth.jwt_expiry': 'Sets the lifetime of issued access tokens in seconds.',
  'auth.enable_signup': 'Controls whether new users can sign up.',
  'auth.enable_anonymous_sign_ins': 'Controls whether anonymous sign-ins are allowed.',
  'auth.enable_manual_linking': 'Controls whether users can manually link identities.',
  'auth.minimum_password_length': 'Sets the minimum accepted password length.',
  'auth.password_requirements': 'Sets the character requirements for passwords.',
  'auth.email.enable_signup': 'Controls whether users can sign up with email.',
  'auth.email.enable_confirmations':
    'Controls whether email confirmation is required before sign-in.',
  'auth.email.double_confirm_changes':
    'Controls whether email changes require confirmation from both addresses.',
  'auth.email.otp_length': 'Sets the number of digits in email one-time passwords.',
  'auth.email.otp_expiry': 'Sets the lifetime of email one-time passwords in seconds.',
  'auth.sms.enable_signup': 'Controls whether users can sign up with a phone number.',
  'auth.sms.enable_confirmations':
    'Controls whether phone confirmation is required before sign-in.',
  'auth.sms.otp_length': 'Sets the number of digits in SMS one-time passwords.',
  'auth.sms.otp_expiry': 'Sets the lifetime of SMS one-time passwords in seconds.',
}

type ParsedToken = Omit<
  TomlValueToken,
  'overriddenByLine' | 'overriddenByScope' | 'overridesLines' | 'overridesScopes' | 'status'
> & {
  applicable: boolean
  precedence: number
}

export function createTomlSourceLines({
  content,
  target,
  gitBranch,
  driftedFields,
}: {
  content: string
  target: GitHubConfigTarget
  gitBranch?: string
  driftedFields: readonly GitHubConfigDriftField[]
}): TomlSourceLine[] {
  const lines = content.split('\n')
  const tokens: ParsedToken[] = []
  const visibleLines: boolean[] = []
  const lineLayers: TomlSourceLayerKind[] = []
  let tablePath: string[] = []
  let currentTableIsVisible = true
  let currentLayer: TomlSourceLayerKind = 'base'

  lines.forEach((line, index) => {
    const table = parseTablePath(line)
    if (table) {
      tablePath = table
      currentTableIsVisible = isTableVisible({ tablePath, target, gitBranch })
      currentLayer = getTableLayer(tablePath)
      visibleLines[index] = currentTableIsVisible
      lineLayers[index] = currentLayer
      return
    }

    visibleLines[index] = currentTableIsVisible
    lineLayers[index] = currentLayer

    const assignment = parseAssignment(line)
    if (!assignment) return

    const resolved = resolveAssignment({
      tablePath,
      keyPath: splitTomlPath(assignment.key),
      target,
      gitBranch,
    })
    const configPath = resolved.configPath

    tokens.push({
      lineNumber: index + 1,
      start: assignment.valueStart,
      end: assignment.valueEnd,
      rawValue: line.slice(assignment.valueStart, assignment.valueEnd),
      configPath,
      scopeLabel: resolved.scopeLabel,
      description:
        CONFIG_DESCRIPTIONS[configPath] ?? `Sets ${configPath} for the ${resolved.scopeLabel}.`,
      applicable: resolved.applicable,
      precedence: resolved.precedence,
    })
  })

  const driftByPath = new Map(driftedFields.map((field) => [field.configPath, field]))
  const applicableByPath = new Map<string, ParsedToken[]>()

  for (const token of tokens) {
    if (!token.applicable) continue
    const matches = applicableByPath.get(token.configPath) ?? []
    matches.push(token)
    applicableByPath.set(token.configPath, matches)
  }

  const resolvedTokens = new Map<number, TomlValueToken>()

  for (const token of tokens) {
    const applicableMatches = applicableByPath.get(token.configPath) ?? []
    const winner = applicableMatches.reduce<ParsedToken | undefined>((current, candidate) => {
      if (!current) return candidate
      if (candidate.precedence !== current.precedence) {
        return candidate.precedence > current.precedence ? candidate : current
      }
      return candidate.lineNumber > current.lineNumber ? candidate : current
    }, undefined)
    const drift = winner === token ? driftByPath.get(token.configPath) : undefined
    const overridden = token.applicable && winner !== undefined && winner !== token

    resolvedTokens.set(token.lineNumber, {
      lineNumber: token.lineNumber,
      start: token.start,
      end: token.end,
      rawValue: token.rawValue,
      configPath: token.configPath,
      scopeLabel: token.scopeLabel,
      description: token.description,
      status: !token.applicable
        ? 'inactive'
        : overridden
          ? 'overridden'
          : drift
            ? 'drifted'
            : 'applied',
      overriddenByLine: overridden ? winner?.lineNumber : undefined,
      overriddenByScope: overridden ? winner?.scopeLabel : undefined,
      overridesLines:
        winner === token
          ? applicableMatches
              .filter((candidate) => candidate !== token)
              .map((candidate) => candidate.lineNumber)
          : [],
      overridesScopes:
        winner === token
          ? Array.from(
              new Set(
                applicableMatches
                  .filter((candidate) => candidate !== token)
                  .map((candidate) => candidate.scopeLabel)
              )
            )
          : [],
      dashboardValue: drift?.dashboardValue,
    })
  }

  return lines.map((text, index) => ({
    lineNumber: index + 1,
    text,
    isVisible: visibleLines[index] ?? true,
    layer: lineLayers[index] ?? 'base',
    value: resolvedTokens.get(index + 1),
  }))
}

function getTableLayer(tablePath: string[]): TomlSourceLayerKind {
  if (tablePath[0] !== 'env') return 'base'
  return tablePath[1] === 'preview' && tablePath[2] === 'branches' ? 'branch' : 'environment'
}

function isTableVisible({
  tablePath,
  target,
  gitBranch,
}: {
  tablePath: string[]
  target: GitHubConfigTarget
  gitBranch?: string
}): boolean {
  if (tablePath[0] !== 'env') return true

  const environment = tablePath[1]
  if (environment !== target) return false

  if (environment === 'preview' && tablePath[2] === 'branches') {
    return tablePath[3] === gitBranch
  }

  return true
}

function parseTablePath(line: string): string[] | undefined {
  const trimmed = line.trim()
  if (!trimmed.startsWith('[') || trimmed.startsWith('[[')) return undefined

  const closingBracket = findUnquotedCharacter(trimmed, ']')
  if (closingBracket < 0) return undefined
  return splitTomlPath(trimmed.slice(1, closingBracket))
}

function parseAssignment(
  line: string
): { key: string; valueStart: number; valueEnd: number } | undefined {
  const equals = findUnquotedCharacter(line, '=')
  if (equals < 0) return undefined

  const key = line.slice(0, equals).trim()
  if (!key || key.startsWith('#')) return undefined

  let valueStart = equals + 1
  while (valueStart < line.length && /\s/.test(line[valueStart])) valueStart += 1

  const comment = findUnquotedCharacter(line, '#', valueStart)
  let valueEnd = comment < 0 ? line.length : comment
  while (valueEnd > valueStart && /\s/.test(line[valueEnd - 1])) valueEnd -= 1
  if (valueStart === valueEnd) return undefined

  return { key, valueStart, valueEnd }
}

function resolveAssignment({
  tablePath,
  keyPath,
  target,
  gitBranch,
}: {
  tablePath: string[]
  keyPath: string[]
  target: GitHubConfigTarget
  gitBranch?: string
}) {
  if (tablePath[0] !== 'env') {
    return {
      configPath: [...tablePath, ...keyPath].join('.'),
      scopeLabel: 'shared configuration',
      applicable: true,
      precedence: 0,
    }
  }

  const environment = tablePath[1]
  if (environment === 'preview' && tablePath[2] === 'branches') {
    const branch = tablePath[3]
    return {
      configPath: [...tablePath.slice(4), ...keyPath].join('.'),
      scopeLabel: `${branch ?? 'unknown'} branch override`,
      applicable: target === 'preview' && branch === gitBranch,
      precedence: 2,
    }
  }

  return {
    configPath: [...tablePath.slice(2), ...keyPath].join('.'),
    scopeLabel: `${environment ?? 'unknown'} override`,
    applicable: environment === target,
    precedence: 1,
  }
}

function splitTomlPath(value: string): string[] {
  const result: string[] = []
  let segment = ''
  let quote: '"' | "'" | undefined
  let escaped = false

  for (const character of value.trim()) {
    if (escaped) {
      segment += character
      escaped = false
      continue
    }
    if (quote === '"' && character === '\\') {
      escaped = true
      continue
    }
    if (character === '"' || character === "'") {
      if (quote === character) quote = undefined
      else if (!quote) quote = character
      else segment += character
      continue
    }
    if (character === '.' && !quote) {
      result.push(segment.trim())
      segment = ''
      continue
    }
    segment += character
  }

  if (segment.trim()) result.push(segment.trim())
  return result
}

function findUnquotedCharacter(value: string, target: string, start = 0): number {
  let quote: '"' | "'" | undefined
  let escaped = false

  for (let index = start; index < value.length; index += 1) {
    const character = value[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (quote === '"' && character === '\\') {
      escaped = true
      continue
    }
    if (character === '"' || character === "'") {
      if (quote === character) quote = undefined
      else if (!quote) quote = character
      continue
    }
    if (character === target && !quote) return index
  }

  return -1
}
