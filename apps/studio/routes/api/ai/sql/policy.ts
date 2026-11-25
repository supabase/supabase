import type { JwtPayload } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { generateText, isStepCount, Output } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getAIDetails } from '@/lib/ai/ai-details'
import { isExplorerEnabled } from '@/lib/ai/is-explorer-enabled'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { RLS_PROMPT } from '@/lib/ai/prompts'
import { withoutApprovalTools } from '@/lib/ai/tool-filter'
import { getTools } from '@/lib/ai/tools'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { trustedUserEmail } from '@/lib/server/configcat'

const policySchema = z.object({
  sql: z.string().describe('The generated Postgres CREATE POLICY statement.'),
  name: z.string().describe('The name of the policy.'),
  command: z
    .enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'])
    .describe('The SQL command this policy applies to.'),
  definition: z
    .string()
    .optional()
    .describe('The USING clause expression (for SELECT, UPDATE, DELETE).'),
  check: z.string().optional().describe('The WITH CHECK clause expression (for INSERT, UPDATE).'),
  action: z
    .enum(['PERMISSIVE', 'RESTRICTIVE'])
    .default('PERMISSIVE')
    .describe('Whether the policy is PERMISSIVE or RESTRICTIVE.'),
  roles: z.array(z.string()).default(['public']).describe('The roles this policy applies to.'),
})

const requestBodySchema = z.object({
  tableName: z.string().min(1),
  schema: z.string().default('public'),
  columns: z.array(z.string()).optional(),
  projectRef: z.string().min(1),
  connectionString: z.string().min(1),
  orgSlug: z.string().optional(),
  message: z.string().optional(),
})

async function handlePost(request: Request, claims?: JwtPayload): Promise<Response> {
  const authorization = request.headers.get('authorization') ?? undefined
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return Response.json({ error: 'Authorization token is required' }, { status: 401 })
  }

  const body = await parseJsonBody(request)
  const { data, error: parseError } = requestBodySchema.safeParse(body)

  if (parseError) {
    return Response.json(
      { error: 'Invalid request body', issues: parseError.issues },
      { status: 400 }
    )
  }

  const { tableName, schema, columns = [], projectRef, connectionString, orgSlug, message } = data

  let aiOptInLevel: AiOptInLevel = 'disabled'

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization && projectRef) {
    try {
      const aiDetails = await getAIDetails({ orgSlug, projectRef, authorization })

      aiOptInLevel = aiDetails.aiOptInLevel
    } catch {
      return Response.json(
        { error: 'There was an error fetching your organization details' },
        { status: 400 }
      )
    }
  }

  const explorerEnabled = await isExplorerEnabled(trustedUserEmail(claims?.email))

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return Response.json({ error: modelError.message }, { status: 500 })
    }

    // Closes the remote MCP connection opened in getTools when generation is done,
    // if anything below throws, or if the client disconnects mid-generation so the
    // connection isn't held until generateText resolves on its own (mirrors the
    // request-scoped cleanup in generate-v4.ts).
    const toolsAbortController = new AbortController()
    const onRequestAbort = () => toolsAbortController.abort()
    if (request.signal.aborted) {
      toolsAbortController.abort()
    } else {
      request.signal.addEventListener('abort', onRequestAbort, { once: true })
    }
    try {
      const allTools = await getTools({
        projectRef,
        connectionString,
        authorization,
        aiOptInLevel,
        accessToken,
        isExplorerEnabled: explorerEnabled,
        signal: toolsAbortController.signal,
      })
      // One-shot generateText can't answer an approval request
      const tools = withoutApprovalTools(allTools)

      const { output } = await generateText({
        ...modelParams,
        stopWhen: isStepCount(5),
        prompt: source`
          You are a Postgres RLS (Row Level Security) expert.
          Determine the most appropriate policies for the "${schema}"."${tableName}" table within a Supabase project.

          ${columns.length > 0 ? `Table columns: ${columns.join(', ')}` : 'No column metadata provided.'}

          ${message ? `User request: ${message}` : ''}

          RLS Guide: ${RLS_PROMPT}

          Requirements:
          - Use the available planning and schema tools (like "list_policies" or "list_tables") to inspect the "${schema}" schema and existing policies before generating new ones.
          - Ensure policies strictly adhere to the existing schema
          - Return a curated list of recommended CREATE POLICY statements as JSON.
          - Each policy must include: name, sql, command (SELECT/INSERT/UPDATE/DELETE/ALL), action (PERMISSIVE/RESTRICTIVE), roles (array of role names).
          - Include "definition" (USING clause expression without the USING keyword) for SELECT, UPDATE, DELETE policies.
          - Include "check" (WITH CHECK clause expression without the WITH CHECK keywords) for INSERT, UPDATE policies.
          - Avoid duplicating existing policies and reference the public schema and typical Supabase best practices when deciding the coverage.
          - Prefer PERMISSIVE policies unless a RESTRICTIVE policy is explicitly required
        `,
        tools,
        output: Output.object({
          schema: z.object({
            policies: z.array(policySchema),
          }),
        }),
      })

      // Add table and schema to each policy from the request
      const policies = (output?.policies ?? []).map((policy) => ({
        ...policy,
        table: tableName,
        schema,
      }))

      return Response.json(policies)
    } finally {
      request.signal.removeEventListener('abort', onRequestAbort)
      toolsAbortController.abort()
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI policy generation failed: ${error.message}`)
      return Response.json(
        { error: 'Failed to generate policy. Please try again.' },
        { status: 500 }
      )
    }
    return Response.json({ error: 'An unknown error occurred.' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/ai/sql/policy')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request, claims }) => handlePost(request, claims),
      },
      { withAuth: true }
    ),
  },
})
