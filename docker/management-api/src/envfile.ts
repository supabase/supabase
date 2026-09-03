import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { AUTH_CONFIG_KEYS } from './auth-config-keys.js'
import { env } from './env.js'
import { type ConfigValue, getAllConfig, getAllEmailTemplates } from './store.js'

export const MANAGED_ENV_FILE = '90-managed.env'

const DURATION_KEYS: Record<string, 'hours' | 'seconds'> = {
  SESSIONS_TIMEBOX: 'hours',
  SESSIONS_INACTIVITY_TIMEOUT: 'hours',
  SMTP_MAX_FREQUENCY: 'seconds',
  SMS_MAX_FREQUENCY: 'seconds',
  MFA_PHONE_MAX_FREQUENCY: 'seconds',
}

const TEMPLATE_CONTENT_RE = /^MAILER_TEMPLATES_([A-Z0-9_]+)_CONTENT$/

const EXTERNAL_ENABLED_RE = /^EXTERNAL_([A-Z0-9_]+)_ENABLED$/
const NO_REDIRECT_URI_PROVIDERS = new Set([
  'EMAIL',
  'PHONE',
  'ANONYMOUS_USERS',
  'WEB3_ETHEREUM',
  'WEB3_SOLANA',
])

export function templateTypeFromConfigKey(key: string): string | null {
  const match = key.match(TEMPLATE_CONTENT_RE)
  return match ? match[1].toLowerCase() : null
}

function escapeEnvValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

function serializeDuration(value: number, unit: 'hours' | 'seconds'): string | null {
  if (value === 0) return null
  return unit === 'hours' ? `${value}h` : `${value}s`
}

function serializeValue(key: string, value: ConfigValue): string | null {
  if (value === null) return null
  const durationUnit = DURATION_KEYS[key]
  if (durationUnit !== undefined && typeof value === 'number') {
    return serializeDuration(value, durationUnit)
  }
  return String(value)
}

function providerNeedingRedirectUri(key: string, value: ConfigValue): string | null {
  const providerMatch = key.match(EXTERNAL_ENABLED_RE)
  if (!providerMatch || value !== true) return null
  return NO_REDIRECT_URI_PROVIDERS.has(providerMatch[1]) ? null : providerMatch[1]
}

export type EnvFileOptions = {
  callbackUrl: string
  templateUrl: (templateType: string) => string
}

export function renderEnvFile(
  config: Record<string, ConfigValue>,
  templateTypes: string[],
  options: EnvFileOptions = defaultEnvFileOptions()
): string {
  const lines: string[] = [
    '# Managed by supabase management-api. Do not edit by hand -',
    '# this file is rewritten on every configuration change and is',
    '# live-reloaded by GoTrue (auth --config-dir).',
  ]

  for (const key of Object.keys(config).sort()) {
    if (!(key in AUTH_CONFIG_KEYS)) continue
    if (TEMPLATE_CONTENT_RE.test(key)) continue

    const serialized = serializeValue(key, config[key])
    if (serialized === null) continue
    lines.push(`GOTRUE_${key}=${escapeEnvValue(serialized)}`)

    const provider = providerNeedingRedirectUri(key, config[key])
    if (provider && options.callbackUrl) {
      lines.push(`GOTRUE_EXTERNAL_${provider}_REDIRECT_URI=${escapeEnvValue(options.callbackUrl)}`)
    }
  }

  for (const templateType of [...templateTypes].sort()) {
    if (!/^[a-z0-9_]+$/.test(templateType)) continue
    lines.push(
      `GOTRUE_MAILER_TEMPLATES_${templateType.toUpperCase()}=${escapeEnvValue(
        options.templateUrl(templateType)
      )}`
    )
  }

  return lines.join('\n') + '\n'
}

function defaultEnvFileOptions(): EnvFileOptions {
  return {
    callbackUrl: env.authCallbackUrl,
    templateUrl: (type) => `${env.selfUrl}/templates/${type}`,
  }
}

export async function syncEnvFile(): Promise<void> {
  const [config, templates] = await Promise.all([getAllConfig(), getAllEmailTemplates()])
  const content = renderEnvFile(
    config,
    templates.map((t) => t.template_type)
  )

  const target = join(env.authConfigDir, MANAGED_ENV_FILE)
  await mkdir(dirname(target), { recursive: true })
  const tmp = `${target}.tmp`
  await writeFile(tmp, content, 'utf8')
  await rename(tmp, target)
}
