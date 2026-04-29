import pgMeta, { getEntityDefinitionsSql } from '@supabase/pg-meta'
import { generateText, ModelMessage, stepCountIs, tool } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { executeSql } from '@/data/sql/execute-sql-query'
import { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getOrgAIDetails } from '@/lib/ai/ai-details'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import {
  COMPLETION_PROMPT,
  EDGE_FUNCTION_PROMPT,
  PG_BEST_PRACTICES,
  SECURITY_PROMPT,
  SQL_COMPLETION_INSTRUCTIONS,
} from '@/lib/ai/prompts'
import apiWrapper from '@/lib/api/apiWrapper'
import { executeQuery } from '@/lib/api/self-hosted/query'

export const maxDuration = 60

const pgMetaSchemasList = pgMeta.schemas.list()
type Schemas = z.infer<(typeof pgMetaSchemasList)['zod']>
type EntityDefinitionRow = { data: { definitions: Array<{ id: number; sql: string }> } }

type SqlFetchParams = {
  projectRef: string
  connectionString: string | null | undefined
  headers: Record<string, string>
}

type SchemaListResult =
  | { error: true }
  | { error: false; queriedSchemas: string[]; otherSchemas: string[] }

type SchemaDDLResult = { error: true } | { error: false; sqlDefinitions: string[] }

async function fetchSchemas(
  includeSchema: boolean,
  { projectRef, connectionString, headers }: SqlFetchParams
): Promise<{ schemas: Schemas; error: boolean }> {
  if (!includeSchema) return { schemas: [], error: false }
  try {
    const { result } = await executeSql<Schemas>(
      { projectRef, connectionString, sql: pgMetaSchemasList.sql },
      undefined,
      headers,
      IS_PLATFORM ? undefined : executeQuery
    )
    return { schemas: result, error: false }
  } catch {
    return { schemas: [], error: true }
  }
}

async function fetchSchemaDDL(
  schemas: string[],
  { projectRef, connectionString, headers }: SqlFetchParams
): Promise<SchemaDDLResult> {
  if (schemas.length === 0) return { error: false, sqlDefinitions: [] }
  try {
    const { result } = await executeSql<EntityDefinitionRow[]>(
      { projectRef, connectionString, sql: getEntityDefinitionsSql({ schemas }) },
      undefined,
      headers,
      IS_PLATFORM ? undefined : executeQuery
    )
    const definitions = result?.[0]?.data?.definitions ?? []
    return {
      error: false,
      sqlDefinitions: definitions.map((d) => d.sql),
    }
  } catch {
    return { error: true }
  }
}

function buildDatabaseSchemaSection({
  includeSchema,
  schemaListResult,
  schemaDDLResult,
}: {
  includeSchema: boolean
  schemaListResult: SchemaListResult
  schemaDDLResult: SchemaDDLResult
}): string {
  if (!includeSchema) {
    return 'Schema context is unavailable — data opt-in is not enabled for this project.'
  }
  const lines: string[] = []

  if (schemaListResult.error) {
    lines.push(
      "Unable to fetch list of available database schemas. Assume `public` schema, infer others from the user's existing code."
    )
  } else {
    lines.push(`Queried schemas: ${schemaListResult.queriedSchemas.join(', ')}`)
    if (schemaListResult.otherSchemas.length > 0)
      lines.push(
        `Other available schemas (use getSchemaDefinitions tool): ${schemaListResult.otherSchemas.join(', ')}`
      )
  }

  if (schemaDDLResult.error) {
    lines.push('Failed to fetch table definitions due to a database error.')
  } else {
    const defsText =
      schemaDDLResult.sqlDefinitions.length > 0
        ? schemaDDLResult.sqlDefinitions.join('\n\n')
        : 'No table definitions found.'
    lines.push(`\n${defsText}`)
  }

  return lines.join('\n')
}

const requestBodySchema = z.object({
  completionMetadata: z.object({
    textBeforeCursor: z.string(),
    textAfterCursor: z.string(),
    prompt: z.string(),
    selection: z.string(),
  }),
  projectRef: z.string(),
  connectionString: z.string().nullish(),
  orgSlug: z.string().optional(),
  language: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    let body: unknown
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      return res.status(400).json({ error: 'Malformed JSON' })
    }
    const { data, error: parseError } = requestBodySchema.safeParse(body)

    if (parseError) {
      return res.status(400).json({ error: 'Invalid request body', issues: parseError.issues })
    }

    const { completionMetadata, projectRef, connectionString, orgSlug, language } = data
    const { textBeforeCursor, textAfterCursor, prompt, selection } = completionMetadata

    const authorization = req.headers.authorization
    let aiOptInLevel: AiOptInLevel = IS_PLATFORM ? 'disabled' : 'schema'

    if (IS_PLATFORM && orgSlug && authorization && projectRef) {
      const { aiOptInLevel: orgAIOptInLevel } = await getOrgAIDetails({
        orgSlug,
        authorization,
      })
      aiOptInLevel = orgAIOptInLevel
    }

    const {
      modelParams,
      error: modelError,
      promptProviderOptions,
    } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(authorization && { Authorization: authorization }),
    }

    const includeSchema = aiOptInLevel !== 'disabled'

    // Fetch schema list first so we can determine which schemas to load DDL for.
    // These are best-effort — if they fail, we proceed without DDL context.
    const { schemas, error: schemaListError } = await fetchSchemas(includeSchema, {
      projectRef,
      connectionString,
      headers,
    })

    // Always include public; also eagerly include any non-public schema whose name
    // appears as `name.` in the cursor context. Checking against the real schema list
    // avoids fetching DDL for table aliases or other false matches. This is robust to
    // incomplete SQL (the user may be mid-typing, so a full parser would fail here).
    const cursorContext = textBeforeCursor + selection + textAfterCursor
    const lowerContext = cursorContext.toLowerCase()
    const schemasToFetch = includeSchema
      ? [
          'public',
          ...schemas
            .filter((s) => {
              const lower = s.name.toLowerCase()
              return (
                s.name !== 'public' &&
                (lowerContext.includes(lower + '.') || lowerContext.includes(`"${lower}".`))
              )
            })
            .map((s) => s.name),
        ]
      : []

    const schemaDDLResult = await fetchSchemaDDL(schemasToFetch, {
      projectRef,
      connectionString,
      headers,
    })

    // Reshape the fetched schemas and candidates into a discriminated union over error states
    const fetchedSchemaSet = new Set(schemasToFetch)
    const schemaListResult: SchemaListResult = schemaListError
      ? { error: true }
      : {
          error: false,
          queriedSchemas: schemasToFetch,
          otherSchemas: schemas.filter((s) => !fetchedSchemaSet.has(s.name)).map((s) => s.name),
        }

    // Important: do not use dynamic content in the system prompt or Bedrock will not cache it
    const system = source`
      ${COMPLETION_PROMPT}
      ${language === 'sql' ? SQL_COMPLETION_INSTRUCTIONS : ''}
      ${language === 'sql' ? PG_BEST_PRACTICES : EDGE_FUNCTION_PROMPT}
      ${SECURITY_PROMPT}
    `

    const userMessage = source`
      ## Database Schema

      ${buildDatabaseSchemaSection({ includeSchema, schemaListResult, schemaDDLResult })}

      ## Code

      \`\`\`${language ?? ''}
      ${textBeforeCursor}<selection>${selection}</selection>${textAfterCursor}
      \`\`\`

      ## Instruction

      ${prompt}
    `

    // Note: these must be of type `CoreMessage` to prevent AI SDK from stripping `providerOptions`
    // https://github.com/vercel/ai/blob/81ef2511311e8af34d75e37fc8204a82e775e8c3/packages/ai/core/prompt/standardize-prompt.ts#L83-L88
    const coreMessages: ModelMessage[] = [
      {
        role: 'system',
        content: system,
        ...(promptProviderOptions && { providerOptions: promptProviderOptions }),
      },
      {
        role: 'user',
        content: userMessage,
      },
    ]

    const { text } = await generateText({
      ...modelParams,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      tools:
        includeSchema && !schemaListResult.error
          ? {
              getSchemaDefinitions: tool({
                description: 'Get table and column definitions for one or more schemas',
                inputSchema: z.object({
                  schemas: z
                    .array(z.string())
                    .describe('The schema names to get the definitions for'),
                }),
                execute: async ({ schemas: maybeSchemas }) => {
                  const validSchemas = maybeSchemas.filter((name) =>
                    schemas.some((s) => s.name === name)
                  )
                  const result = await fetchSchemaDDL(validSchemas, {
                    projectRef,
                    connectionString,
                    headers,
                  })
                  if (result.error)
                    return 'Failed to fetch schema definitions due to a database error.'
                  if (result.sqlDefinitions.length === 0) return 'No table definitions found.'
                  return result.sqlDefinitions.join('\n\n')
                },
              }),
            }
          : undefined,
    })

    return res.status(200).json(text)
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({ error: 'Failed to generate completion' })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
