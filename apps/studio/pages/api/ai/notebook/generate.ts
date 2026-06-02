import { generateText, Output, stepCountIs } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getOrgAIDetails } from '@/lib/ai/ai-details'
import { getModel } from '@/lib/ai/model'
import { NOTEBOOK_GENERATE_MODEL } from '@/lib/ai/model.utils'
import {
  notebookGenerateOutputSchema,
  type NotebookGenerateOutput,
} from '@/lib/ai/notebook-generate-schema'
import {
  LOGS_EXPLORER_SQL_INSTRUCTIONS,
  PG_BEST_PRACTICES,
  SQL_COMPLETION_INSTRUCTIONS,
} from '@/lib/ai/prompts'
import { getTools } from '@/lib/ai/tools'
import apiWrapper from '@/lib/api/apiWrapper'

export const maxDuration = 60

const requestBodySchema = z.object({
  prompt: z.string().min(1, 'Description is required'),
  name: z.string().optional(),
  projectRef: z.string().optional(),
  connectionString: z.string().optional(),
  orgSlug: z.string().optional(),
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

  const { prompt, name, projectRef, connectionString, orgSlug } = data

  let aiOptInLevel: AiOptInLevel = 'disabled'

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization) {
    try {
      const { aiOptInLevel: orgAIOptInLevel } = await getOrgAIDetails({
        orgSlug,
        authorization,
      })
      aiOptInLevel = orgAIOptInLevel
    } catch {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: NOTEBOOK_GENERATE_MODEL,
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const hasSchemaContext = Boolean(projectRef && connectionString)
    const tools =
      hasSchemaContext && projectRef && connectionString
        ? await getTools({
            projectRef,
            connectionString,
            authorization,
            aiOptInLevel,
            accessToken,
          })
        : undefined

    const system = source`
      You are a Supabase Postgres expert helping users build SQL notebooks.
      A notebook is a sequence of SQL blocks. Each block should answer one focused question or metric.
      Prefer read-only SELECT queries unless the user explicitly asks for writes.
      ${PG_BEST_PRACTICES}
      ${SQL_COMPLETION_INSTRUCTIONS}
      ${LOGS_EXPLORER_SQL_INSTRUCTIONS}
    `

    const userPrompt = source`
      Design a SQL notebook for this goal:

      ${prompt}

      ${name ? `Preferred notebook name: ${name} (set suggested_name to an empty string)` : 'The user did not provide a notebook name yet — set suggested_name to a concise title.'}

      Requirements:
      - Return between 1 and 8 blocks with clear labels.
      - Each block must contain a complete, runnable SQL query.
      - Use query_source "logs" only for Supabase Logs Explorer queries (edge_logs, postgres_logs, auth_logs, etc.); otherwise use "database".
      - Set logs_time_range to the most appropriate supported picker range for every logs block, and null for database blocks. Keep each logs SQL timestamp filter consistent with logs_time_range.
      - For logs blocks: alias the log table, qualify every source timestamp as <alias>.timestamp (never bare timestamp with unnests), filter on that qualified timestamp, and include LIMIT ≤ 1000. Do not invent top-level fields: product-specific values are usually nested under metadata and require UNNEST joins. In particular, postgres_logs severity is metadata[].parsed[].error_severity (for example, p.error_severity after unnesting), never pl.severity. For raw event rows, ORDER BY <alias>.timestamp. For aggregates, ORDER BY only a grouped output alias or aggregate alias; never ORDER BY the raw timestamp unless it is grouped. For time series, use a bucket alias such as log_time in SELECT, GROUP BY, ORDER BY, and result_config.
      - Set result_config on every block: view "chart" with x_key/y_key matching SELECT column aliases for time series and aggregates; view "table" for exploratory or wide results (use empty x_key/y_key, chart_type "bar", cumulative false).
      - Order blocks so earlier blocks establish context and later blocks build insights.
      ${tools ? '- Use list_tables or related schema tools when needed so queries match the project schema.' : '- Infer reasonable table and column names when schema is unavailable.'}
    `

    const generateParams = {
      ...modelParams,
      system,
      prompt: userPrompt,
      ...(tools
        ? {
            tools,
            stopWhen: stepCountIs(5),
            experimental_output: Output.object({ schema: notebookGenerateOutputSchema }),
          }
        : {
            output: Output.object({ schema: notebookGenerateOutputSchema }),
          }),
    }

    const result = await generateText(generateParams)

    const generated: NotebookGenerateOutput | undefined = tools
      ? result.experimental_output
      : result.output

    if (!generated?.blocks?.length) {
      return res.status(500).json({
        error: 'Failed to generate notebook blocks. Please try again.',
      })
    }

    return res.json(generated)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI notebook generation failed: ${error.message}`)

      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your notebook description is too large for Supabase Assistant to ingest. Try a shorter description.',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the notebook. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
