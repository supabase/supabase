import { generateText, Output, stepCountIs } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import { RLS_PROMPT } from 'lib/ai/prompts'
import { getTools } from 'lib/ai/tools'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { data, error: parseError } = requestBodySchema.safeParse(body)

  if (parseError) {
    return res.status(400).json({ error: 'Invalid request body', issues: parseError.issues })
  }

  const { tableName, schema, columns = [], projectRef, connectionString, orgSlug, message } = data

  let aiOptInLevel: AiOptInLevel = 'disabled'

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization) {
    try {
      const { aiOptInLevel: orgAIOptInLevel } = await getOrgAIDetails({
        orgSlug,
        authorization,
        projectRef,
      })

      aiOptInLevel = orgAIOptInLevel
    } catch (error) {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  try {
    const {
      model,
      error: modelError,
      providerOptions,
    } = await getModel({
      provider: 'openai',
      routingKey: 'sql-policy',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
    })

    const { experimental_output } = await generateText({
      model,
      providerOptions,
      stopWhen: stepCountIs(5),
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
      experimental_output: Output.object({
        schema: z.object({
          policies: z.array(policySchema),
        }),
      }),
    })

    // Add table and schema to each policy from the request
    const policies = (experimental_output?.policies ?? []).map((policy) => ({
      ...policy,
      table: tableName,
      schema,
    }))

    return res.json(policies)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI policy generation failed: ${error.message}`)
      return res.status(500).json({
        error: 'Failed to generate policy. Please try again.',
      })
    }
    return res.status(500).json({
      error: 'An unknown error occurred.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
