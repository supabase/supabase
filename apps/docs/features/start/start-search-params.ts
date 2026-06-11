import {
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs'
import { DEFAULT_CONFIG, PRIM_ORDER } from 'start'

const nuqsOptions = { history: 'replace' as const, clearOnDefault: true }

const PROJECT_KINDS = ['new', 'existing'] as const
const FRAMEWORK_IDS = ['nextjs', 'vite', 'tanstack', 'none'] as const
const ORM_IDS = ['none', 'drizzle', 'prisma'] as const
const CONNECTION_IDS = ['remote', 'local'] as const
const AGENT_IDS = ['claude', 'codex'] as const

const primitiveParser = parseAsStringLiteral(PRIM_ORDER)

export const startNuqsSearchParams = {
  project: parseAsStringLiteral(PROJECT_KINDS)
    .withDefault(DEFAULT_CONFIG.project)
    .withOptions(nuqsOptions),
  framework: parseAsStringLiteral(FRAMEWORK_IDS)
    .withDefault(DEFAULT_CONFIG.framework)
    .withOptions(nuqsOptions),
  shadcn: parseAsBoolean.withDefault(DEFAULT_CONFIG.shadcn).withOptions(nuqsOptions),
  primitives: parseAsArrayOf(primitiveParser)
    .withDefault(DEFAULT_CONFIG.primitives)
    .withOptions(nuqsOptions),
  orm: parseAsStringLiteral(ORM_IDS).withDefault(DEFAULT_CONFIG.orm).withOptions(nuqsOptions),
  connection: parseAsStringLiteral(CONNECTION_IDS)
    .withDefault(DEFAULT_CONFIG.connection)
    .withOptions(nuqsOptions),
  agent: parseAsStringLiteral(AGENT_IDS).withDefault(DEFAULT_CONFIG.agent).withOptions(nuqsOptions),
  templates: parseAsArrayOf(parseAsString)
    .withDefault(DEFAULT_CONFIG.templateIds)
    .withOptions(nuqsOptions),
}

export type StartNuqsSearchParams = {
  [K in keyof typeof startNuqsSearchParams]: (typeof startNuqsSearchParams)[K] extends {
    parse: (value: string) => infer T
  }
    ? T
    : never
}

export const serializeStartNuqsSearchParams = createSerializer(startNuqsSearchParams)
