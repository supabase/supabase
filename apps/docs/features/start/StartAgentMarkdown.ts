import { BASE_PATH } from '~/lib/constants'
import {
  AGENTS,
  buildAgentPlan,
  buildProjectCodePlan,
  buildStartComposition,
  DEFAULT_START_SEARCH_PARAMS,
  FRAMEWORKS,
  ORMS,
  parseStartConfigFromSearchParams,
  PRIM_ORDER,
  PRIMITIVES,
  selectedPrimitives,
  selectedTemplateNames,
  startConfigToSearchParams,
  type StartConfig,
  type StartSearchParams,
  type Template,
} from 'start'
import { getStartTemplateRepository } from 'start/server'

import { START_AGENT_FORMAT_PARAM } from './StartAgent.constants'

export { START_AGENT_FORMAT_PARAM }

const PROJECT_VALUES = ['new', 'existing'] as const
const CONNECTION_LABELS = {
  remote: 'hosted Supabase project',
  local: 'local Supabase stack (Docker)',
} satisfies Record<StartConfig['connection'], string>

export function buildStartAgentMarkdown(url: URL, templates: Template[]): string {
  const cfg = parseStartConfigFromSearchParams(readStartSearchParams(url.searchParams), templates)
  const composition = buildStartComposition(cfg, templates)
  const plan = buildAgentPlan(cfg, composition)
  const projectCodePlan = buildProjectCodePlan(cfg, composition)
  const templateRepository = getStartTemplateRepository()
  const normalizedUrl = `${BASE_PATH}/start?${formatStartSearchParams(startConfigToSearchParams(cfg))}`
  const services = selectedPrimitives(cfg, composition).map(
    (primitive) => PRIMITIVES[primitive].label
  )
  const resolvedTemplateNames = selectedTemplateNames(composition)

  return [
    '# Supabase Start',
    '',
    'This response is generated from the `/docs/start` query params. Change the query params to generate a different setup guide and agent prompt.',
    '',
    '## Current configuration',
    '',
    `- Project: ${cfg.project === 'new' ? 'new project' : 'existing project'}`,
    `- Framework: ${frameworkLabel(cfg)}`,
    `- UI: ${uiLabel(cfg)}`,
    `- Services: ${services.length ? services.join(', ') : 'none selected'}`,
    `- Data layer: ${ORMS[cfg.orm].label}`,
    `- Connection: ${CONNECTION_LABELS[cfg.connection]}`,
    `- Agent: ${AGENTS[cfg.agent].label}`,
    `- Explicit template IDs: ${cfg.templateIds.length ? cfg.templateIds.join(', ') : 'none'}`,
    `- Resolved templates: ${resolvedTemplateNames.length ? resolvedTemplateNames.join(', ') : 'none'}`,
    '',
    'Normalized URL for this configuration:',
    '',
    '```text',
    normalizedUrl,
    '```',
    '',
    '## Customize via query params',
    '',
    'Set any of these params on `/docs/start`. Missing or invalid values fall back to the default configuration.',
    '',
    `- \`project\`: ${formatValues(PROJECT_VALUES)}`,
    `- \`framework\`: ${formatValues(Object.keys(FRAMEWORKS))}`,
    '- `shadcn`: `true` or `false`',
    `- \`primitives\`: comma-separated values from ${formatValues(PRIM_ORDER)}`,
    `- \`orm\`: ${formatValues(Object.keys(ORMS))}`,
    `- \`connection\`: ${formatValues(Object.keys(CONNECTION_LABELS))}`,
    `- \`agent\`: ${formatValues(Object.keys(AGENTS))}`,
    '- `templates`: comma-separated template IDs. Template dependencies are resolved automatically.',
    '',
    'Example:',
    '',
    '```text',
    `${BASE_PATH}/start?project=existing&framework=vite&shadcn=false&primitives=database,auth,storage&orm=drizzle&connection=local&agent=codex&templates=storage-avatars`,
    '```',
    '',
    '## Template registry',
    '',
    `Supabase Start templates are read from the [${templateRepository}](${templateRepositoryUrl(templateRepository)}) shadcn registry. Use the IDs below in the \`templates\` query param, or install templates directly into a project with the shadcn CLI.`,
    '',
    'List available templates:',
    '',
    '```bash',
    projectCodePlan.listCommand,
    '```',
    '',
    'Add a template to a project:',
    '',
    '```bash',
    projectCodePlan.addExampleCommand,
    '```',
    '',
    'Template dependencies are declared in the registry and resolved automatically.',
    '',
    '## Available template IDs',
    '',
    ...templates.map((template) => templateListItem(template)),
    '',
    '## Generated prompt.plan',
    '',
    plan,
  ].join('\n')
}

export function buildStartAgentHtml(markdown: string): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Supabase Start prompt plan | Supabase Docs</title>',
    '<meta name="description" content="Supabase Start configuration instructions and generated agent prompt plan.">',
    `<link rel="canonical" href="https://supabase.com${BASE_PATH}/start">`,
    '</head>',
    '<body>',
    '<main>',
    `<pre>${escapeHtml(markdown)}</pre>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('')
}

function readStartSearchParams(searchParams: URLSearchParams): StartSearchParams {
  return {
    project: readString(searchParams, 'project', DEFAULT_START_SEARCH_PARAMS.project),
    framework: readString(searchParams, 'framework', DEFAULT_START_SEARCH_PARAMS.framework),
    shadcn: readBoolean(searchParams, 'shadcn', DEFAULT_START_SEARCH_PARAMS.shadcn),
    primitives: readArray(searchParams, 'primitives', DEFAULT_START_SEARCH_PARAMS.primitives),
    orm: readString(searchParams, 'orm', DEFAULT_START_SEARCH_PARAMS.orm),
    connection: readString(searchParams, 'connection', DEFAULT_START_SEARCH_PARAMS.connection),
    agent: readString(searchParams, 'agent', DEFAULT_START_SEARCH_PARAMS.agent),
    templates: readArray(searchParams, 'templates', DEFAULT_START_SEARCH_PARAMS.templates),
  }
}

function readString<T extends string>(searchParams: URLSearchParams, key: string, fallback: T): T {
  return (searchParams.get(key) ?? fallback) as T
}

function readBoolean(searchParams: URLSearchParams, key: string, fallback: boolean): boolean {
  const value = searchParams.get(key)
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

function readArray<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  fallback: T[]
): T[] {
  const values = searchParams.getAll(key)
  if (values.length === 0) return fallback

  return values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean) as T[]
}

function frameworkLabel(cfg: StartConfig): string {
  const framework = FRAMEWORKS[cfg.framework]
  return cfg.framework === 'none' ? framework.label : `${framework.label} (${framework.meta})`
}

function uiLabel(cfg: StartConfig): string {
  if (cfg.framework === 'none') return 'none'
  return cfg.shadcn ? 'shadcn/ui + Supabase UI Library blocks' : 'existing components'
}

function formatValues(values: readonly string[]) {
  return values.map((value) => `\`${value}\``).join(', ')
}

function templateListItem(template: Template): string {
  const dependencies = template.dependencies?.required?.length
    ? ` Requires: ${template.dependencies.required.join(', ')}.`
    : ''

  return `- \`${template.id}\`: ${template.name} - ${template.description}.${dependencies}`
}

function templateRepositoryUrl(repository: string): string {
  const trimmed = repository.trim().replace(/\/+$/, '')
  if (trimmed.startsWith('https://github.com/')) return trimmed

  return `https://github.com/${trimmed}`
}

function formatStartSearchParams(params: StartSearchParams): string {
  return [
    ['project', params.project],
    ['framework', params.framework],
    ['shadcn', String(params.shadcn)],
    ['primitives', params.primitives.join(',')],
    ['orm', params.orm],
    ['connection', params.connection],
    ['agent', params.agent],
    ['templates', params.templates.join(',')],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replaceAll('%2C', ',')}`)
    .join('&')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
