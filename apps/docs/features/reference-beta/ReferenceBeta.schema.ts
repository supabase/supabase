import { z } from 'zod/v4'

/**
 * Schema for reference-beta content.
 *
 * Libraries publish one Markdown file per definition (YAML frontmatter, with
 * optional free-form notes in the body). This file is the single source of
 * truth for that format: the docs app validates with it at fetch time and at
 * render time, and `content/reference-beta/definition.schema.json` is generated
 * from it so library repos can check their own output without depending on
 * this app. Regenerate the JSON with `pnpm run reference-beta:schema`.
 */

export const PARAMETER_LOCATIONS = [
  'argument',
  'positional',
  'flag',
  'path',
  'query',
  'header',
  'body',
  'property',
] as const

export const DEFINITION_KINDS = [
  'method',
  'command',
  'endpoint',
  'class',
  'type',
  'constant',
] as const

export const STABILITY_LEVELS = ['stable', 'beta', 'experimental'] as const

export interface Parameter {
  name: string
  location?: (typeof PARAMETER_LOCATIONS)[number]
  type?: string
  required: boolean
  description?: string
  default?: unknown
  allowed_values?: (string | number | boolean)[]
  short?: string
  env?: string
  variadic?: boolean
  deprecated?: boolean
  replaced_by?: string
  children?: Parameter[]
}

const parameterSchema = z.strictObject({
  name: z.string(),
  location: z.enum(PARAMETER_LOCATIONS).optional().describe('Where the parameter is passed.'),
  type: z.string().optional(),
  required: z.boolean().default(false),
  description: z.string().optional().describe('Markdown.'),
  default: z.unknown().optional(),
  allowed_values: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
  short: z.string().optional().describe('Short flag, e.g. `-i`. Commands only.'),
  env: z.string().optional().describe('Environment variable that sets this parameter.'),
  variadic: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  replaced_by: z.string().optional(),
  // Annotated because a schema can't infer a type that refers to itself.
  get children(): z.ZodOptional<z.ZodArray<z.ZodType<Parameter>>> {
    return z.array(parameterSchema).optional().describe('Nested fields, same shape.')
  },
})

const exampleSchema = z.strictObject({
  id: z.string().describe('Stable within the definition.'),
  title: z.string(),
  description: z.string().optional().describe('Markdown.'),
  lang: z.string().default('plaintext').describe('Code fence language, e.g. `js`, `sh`.'),
  code: z.string(),
  response: z.string().optional().describe('Sample output.'),
})

export const definitionFrontmatterSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
    .describe('Stable, shared across languages. Must match the file name.'),
  kind: z.enum(DEFINITION_KINDS),
  category: z.string().default('general').describe('Groups definitions on the library index page.'),
  title: z.string(),
  symbol: z.string().optional().describe('Fully qualified name, e.g. `supabase.auth.signUp`.'),
  summary: z.string().describe('One line, used in lists.'),
  description: z.string().optional().describe('Markdown.'),
  signature: z.string().optional().describe('Methods, classes, types and constants.'),
  usage: z.string().optional().describe('Commands only.'),
  http: z
    .strictObject({ method: z.string(), path: z.string() })
    .optional()
    .describe('Endpoints only.'),
  type_params: z.array(z.string()).optional(),
  stability: z.enum(STABILITY_LEVELS).default('stable'),
  deprecated: z.boolean().default(false),
  since: z.string().optional(),
  requires: z.array(z.string()).optional(),
  inherits_flags: z.string().optional().describe('Commands that also accept a shared flag group.'),
  auth: z
    .strictObject({
      scopes: z.array(z.string()).default([]),
      permissions: z.array(z.string()).default([]),
    })
    .optional()
    .describe('Endpoints only.'),
  parameters: z
    .array(parameterSchema)
    .default([])
    .describe('Arguments of methods, commands and endpoints; constructor arguments of classes.'),
  properties: z
    .array(parameterSchema)
    .default([])
    .describe('Members of classes and types. Same shape as parameters, `location: property`.'),
  returns: z
    .strictObject({ type: z.string(), description: z.string().optional() })
    .optional()
    .describe('Methods.'),
  responses: z
    .array(
      z.strictObject({
        status: z.number().int(),
        description: z.string().optional(),
        schema: z.unknown().optional(),
      })
    )
    .optional()
    .describe('Endpoints only.'),
  throws: z
    .array(
      z.strictObject({
        type: z
          .string()
          .optional()
          .describe('Error type. Omitted when only a description is given.'),
        description: z.string().optional(),
      })
    )
    .default([]),
  examples: z.array(exampleSchema).default([]),
})

/**
 * Frontmatter of a library's (or library version's) `index.md`. The Markdown
 * body is the introduction; definitions are listed under it.
 */
export const libraryIndexFrontmatterSchema = z.strictObject({
  title: z.string(),
  package: z
    .string()
    .optional()
    .describe('Package or binary name shown under the title, e.g. `@supabase/server`.'),
  repo: z.string().url().optional().describe('Source repository, linked from the package name.'),
  icon: z
    .string()
    .optional()
    .describe('Menu icon id shown next to the title, e.g. `reference-javascript`.'),
  version: z.string().optional(),
  description: z.string().optional(),
  category_order: z
    .array(z.string())
    .optional()
    .describe('Category ids in display order. Unlisted categories follow alphabetically.'),
  code_lang: z.string().optional().describe('Language used to label signatures.'),
})

export type DefinitionFrontmatter = z.output<typeof definitionFrontmatterSchema>
export type LibraryIndexFrontmatter = z.output<typeof libraryIndexFrontmatterSchema>
