import { serve } from '@hono/node-server'
import { type Context, type Env, type Handler, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { logger } from 'hono/logger'
import { timingSafeEqual } from 'node:crypto'

import { AUTH_CONFIG_KEYS } from './auth-config-keys.js'
import { baselineConfig } from './baseline.js'
import { RenderQueueFullError, renderReactEmail } from './emails.js'
import { env } from './env.js'
import { syncEnvFile, templateTypeFromConfigKey } from './envfile.js'
import { defaultAuthConfig } from './gotrue-defaults.js'
import { defaultReactEmailSource } from './react-email-defaults.js'
import {
  type ConfigValue,
  deleteConfig,
  deleteEmailTemplate,
  getAllConfig,
  getEmailTemplate,
  migrate,
  type Queryable,
  upsertConfig,
  upsertEmailTemplate,
  withTransaction,
} from './store.js'
import { redactWriteOnlyKeys } from './write-only.js'

const app = new Hono()

app.use(logger())

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/templates/:type', async (c) => {
  const template = await getEmailTemplate(c.req.param('type'))
  if (!template) return c.text('template not found', 404)
  return c.html(template.rendered_html)
})

function isValidApiToken(authorization: string): boolean {
  const expected = Buffer.from(`Bearer ${env.apiToken}`)
  const provided = Buffer.from(authorization)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

app.use('/platform/*', async (c, next) => {
  if (!isValidApiToken(c.req.header('authorization') ?? '')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
  await next()
})

const MAX_BODY_BYTES = 4 * 1024 * 1024

app.use(
  '/platform/*',
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ message: 'request body is too large' }, 413),
  })
)

async function readJsonObject(c: Context): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await c.req.json()
    if (body === null || typeof body !== 'object' || Array.isArray(body)) return null
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

function isProjectRef(ref: string): boolean {
  return ref === 'default'
}

function validateConfigPayload(payload: Record<string, unknown>): {
  valid: Record<string, ConfigValue>
  errors: string[]
} {
  const valid: Record<string, ConfigValue> = {}
  const errors: string[] = []
  for (const [key, value] of Object.entries(payload)) {
    const expected = AUTH_CONFIG_KEYS[key]
    if (expected === undefined) {
      errors.push(`unknown config key: ${key}`)
      continue
    }
    if (value === null) {
      valid[key] = null
      continue
    }
    const isExpectedType =
      typeof value === expected &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    if (isExpectedType) {
      valid[key] = value
      continue
    }
    errors.push(`config key ${key} must be a ${expected}`)
  }
  return { valid, errors }
}

async function storeHtmlTemplates(config: Record<string, ConfigValue>, tx: Queryable) {
  for (const [key, value] of Object.entries(config)) {
    const templateType = templateTypeFromConfigKey(key)
    if (!templateType) continue
    if (value === null) {
      await deleteEmailTemplate(templateType, tx)
    } else if (typeof value === 'string') {
      await upsertEmailTemplate(
        {
          template_type: templateType,
          source: value,
          source_format: 'html',
          rendered_html: value,
        },
        tx
      )
    }
  }
}

async function applyConfigPatch(payload: Record<string, unknown>): Promise<string[]> {
  const { valid, errors } = validateConfigPayload(payload)
  if (errors.length > 0) return errors
  await withTransaction(async (tx) => {
    await storeHtmlTemplates(valid, tx)
    await upsertConfig(valid, tx)
  })
  await syncEnvFile()
  return []
}

async function currentConfig() {
  const stored = await getAllConfig()
  const templatesCustom: Record<string, boolean> = {}
  const subjectsCustom: Record<string, boolean> = {}
  for (const key of Object.keys(stored)) {
    if (templateTypeFromConfigKey(key)) templatesCustom[key] = true
    else if (key.startsWith('MAILER_SUBJECTS_')) subjectsCustom[key] = true
  }
  return {
    ...redactWriteOnlyKeys({ ...defaultAuthConfig(), ...baselineConfig(), ...stored }),
    MAILER_TEMPLATES_CUSTOM_CONTENTS: templatesCustom,
    MAILER_SUBJECTS_CUSTOM_CONTENTS: subjectsCustom,
  }
}

app.get('/platform/auth/:ref/config', async (c) => {
  if (!isProjectRef(c.req.param('ref'))) return c.json({ message: 'project not found' }, 404)
  return c.json(await currentConfig())
})

const handleConfigPatch: Handler<Env, '/platform/auth/:ref/config'> = async (c) => {
  if (!isProjectRef(c.req.param('ref'))) return c.json({ message: 'project not found' }, 404)
  const payload = await readJsonObject(c)
  if (!payload) return c.json({ message: 'body must be a JSON object' }, 400)
  const errors = await applyConfigPatch(payload)
  if (errors.length > 0) return c.json({ message: errors.join('; ') }, 400)
  return c.json(await currentConfig())
}

app.patch('/platform/auth/:ref/config', handleConfigPatch)
app.patch('/platform/auth/:ref/config/hooks', handleConfigPatch)

const TEMPLATE_TYPES = new Set(
  Object.keys(AUTH_CONFIG_KEYS)
    .map(templateTypeFromConfigKey)
    .filter((type): type is string => type !== null)
)

function templateParam(c: { req: { param: (name: string) => string } }): string | null {
  const template = c.req.param('template').toLowerCase()
  return TEMPLATE_TYPES.has(template) ? template : null
}

app.post('/platform/auth/:ref/templates/:template/reset', async (c) => {
  if (!isProjectRef(c.req.param('ref'))) return c.json({ message: 'project not found' }, 404)
  const template = templateParam(c)
  if (!template) return c.json({ message: 'unknown template type' }, 400)
  await withTransaction(async (tx) => {
    await deleteEmailTemplate(template, tx)
    await deleteConfig(
      [
        `MAILER_TEMPLATES_${template.toUpperCase()}_CONTENT`,
        `MAILER_SUBJECTS_${template.toUpperCase()}`,
      ],
      tx
    )
  })
  await syncEnvFile()
  return c.json(await currentConfig())
})

app.put('/platform/auth/:ref/templates/:template/react', async (c) => {
  if (!isProjectRef(c.req.param('ref'))) return c.json({ message: 'project not found' }, 404)
  const template = templateParam(c)
  if (!template) return c.json({ message: 'unknown template type' }, 400)
  const source = (await readJsonObject(c))?.source
  if (!source || typeof source !== 'string') {
    return c.json({ message: 'body must contain a `source` string' }, 400)
  }

  let renderedHtml: string
  try {
    renderedHtml = await renderReactEmail(source)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (err instanceof RenderQueueFullError) return c.json({ message }, 429)
    return c.json({ message: `failed to render template: ${message}` }, 400)
  }

  await withTransaction(async (tx) => {
    await upsertEmailTemplate(
      {
        template_type: template,
        source,
        source_format: 'react',
        rendered_html: renderedHtml,
      },
      tx
    )
    await upsertConfig(
      {
        [`MAILER_TEMPLATES_${template.toUpperCase()}_CONTENT`]: renderedHtml,
      },
      tx
    )
  })
  await syncEnvFile()
  return c.json({ template_type: template, rendered_html: renderedHtml })
})

app.get('/platform/auth/:ref/templates/:template/react', async (c) => {
  if (!isProjectRef(c.req.param('ref'))) return c.json({ message: 'project not found' }, 404)
  const type = templateParam(c)
  if (!type) return c.json({ message: 'unknown template type' }, 400)
  const template = await getEmailTemplate(type)
  if (template && template.source_format === 'react') {
    return c.json({ ...template, is_default: false })
  }
  const source = defaultReactEmailSource(type)
  if (!source) return c.json({ message: 'react template not found' }, 404)
  return c.json({
    template_type: type,
    source,
    source_format: 'react',
    rendered_html: null,
    is_default: true,
  })
})

async function main() {
  await migrate()
  await syncEnvFile()
  serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`management-api listening on :${info.port}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
