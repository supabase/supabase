import { z } from 'zod'

const nonEmpty = z.string().min(1)

const cliTagSchema = z.object({ id: nonEmpty, title: nonEmpty }).strict()

const cliAcceptedValueSchema = z
  .object({ id: nonEmpty, name: z.string(), type: z.string() })
  .strict()

const cliFlagSchema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    description: z.string(),
    default_value: z.string(),
    required: z.boolean().optional(),
    accepted_values: z.array(cliAcceptedValueSchema).optional(),
  })
  .strict()

const cliLinkSchema = z.object({ name: nonEmpty, url: nonEmpty }).strict()

const cliExampleSchema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    code: z.string(),
    response: z.string().optional(),
  })
  .strict()

const cliInfoSchema = z
  .object({
    id: nonEmpty,
    version: nonEmpty,
    title: nonEmpty,
    language: nonEmpty,
    source: nonEmpty,
    bugs: nonEmpty,
    spec: nonEmpty,
    description: z.string(),
    tags: z.array(cliTagSchema),
  })
  .strict()

const cliCommandSchemaV001 = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    summary: nonEmpty,
    description: z.string().optional(),
    tags: z.array(z.string()),
    links: z.array(cliLinkSchema),
    usage: z.string().optional(),
    subcommands: z.array(z.string()),
    flags: z.array(cliFlagSchema),
    examples: z.array(cliExampleSchema).optional(),
  })
  .strict()

const cliBreakingChangeSchema = z
  .object({
    id: nonEmpty,
    major: z.number().int().positive(),
    summary: nonEmpty,
    direction: z.enum(['upcoming', 'changed']).optional(),
    flags: z.array(z.string()).optional(),
    // Site-relative paths are allowed: the migration guide lives on this site.
    migration_url: z
      .string()
      .refine((value) => value.startsWith('/') || URL.canParse(value), 'Invalid URL')
      .optional(),
  })
  .strict()

const cliCommandSchemaV002 = cliCommandSchemaV001
  .extend({
    breaking_changes: z.array(cliBreakingChangeSchema).optional(),
    // A draft 2020-12 JSON Schema of the command's `--output-format json` stdout.
    json_output_schema: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export const cliSpecSchemaV001 = z
  .object({
    clispec: z.literal('001'),
    info: cliInfoSchema,
    flags: z.array(cliFlagSchema),
    commands: z.array(cliCommandSchemaV001),
  })
  .strict()

/**
 * 001 plus an optional `prerelease` marker and optional per-command `breaking_changes` and
 * `json_output_schema`.
 */
export const cliSpecSchemaV002 = z
  .object({
    clispec: z.literal('002'),
    prerelease: z.boolean().optional(),
    info: cliInfoSchema,
    flags: z.array(cliFlagSchema),
    commands: z.array(cliCommandSchemaV002),
  })
  .strict()

export type CliInfo = z.infer<typeof cliInfoSchema>
export type CliFlag = z.infer<typeof cliFlagSchema>
export type CliBreakingChange = z.infer<typeof cliBreakingChangeSchema>
export type CliCommand = z.infer<typeof cliCommandSchemaV002>
export type CliSpecV001 = z.infer<typeof cliSpecSchemaV001>
export type CliSpecV002 = z.infer<typeof cliSpecSchemaV002>
export type CliSpec = CliSpecV001 | CliSpecV002

const SCHEMAS = { '001': cliSpecSchemaV001, '002': cliSpecSchemaV002 } as const

/**
 * Validates a parsed CLI spec, picking the schema from its `clispec` field.
 * Throws an error that lists every offending path.
 */
export function parseCliSpec(raw: unknown, source = 'CLI spec'): CliSpec {
  const version =
    typeof raw === 'object' && raw !== null ? (raw as { clispec?: unknown }).clispec : undefined

  if (typeof version !== 'string' || !(version in SCHEMAS)) {
    throw new Error(
      `${source}: unsupported clispec ${JSON.stringify(version)} (supported: ${Object.keys(SCHEMAS).join(', ')})`
    )
  }

  const result = SCHEMAS[version as keyof typeof SCHEMAS].safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`${source}: invalid clispec ${version} document:\n${issues}`)
  }

  return result.data as CliSpec
}
