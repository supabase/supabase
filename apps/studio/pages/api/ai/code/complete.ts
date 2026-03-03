import pgMeta from '@supabase/pg-meta'
import { generateText, ModelMessage, stepCountIs } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import { executeSql } from 'data/sql/execute-sql-query'
import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import {
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  OUTPUT_ONLY_PROMPT,
  PG_BEST_PRACTICES,
  RLS_PROMPT,
  SECURITY_PROMPT,
} from 'lib/ai/prompts'
import { getTools } from 'lib/ai/tools'
import apiWrapper from 'lib/api/apiWrapper'
import { executeQuery } from 'lib/api/self-hosted/query'
import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

export const maxDuration = 60

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ data: null, error: { message: `Method ${req.method} Not Allowed` } }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST' },
      }
    )
  }

  try {
    const { completionMetadata, projectRef, connectionString, orgSlug, language } = req.body
    const { textBeforeCursor, textAfterCursor, prompt, selection } = completionMetadata

    if (!projectRef) {
      return res.status(400).json({
        error: 'Missing project_ref in request body',
      })
    }

    const authorization = req.headers.authorization
    const accessToken = authorization?.replace('Bearer ', '')

    let aiOptInLevel: AiOptInLevel = 'disabled'

    if (!IS_PLATFORM) {
      aiOptInLevel = 'schema'
    }

    if (IS_PLATFORM && orgSlug && authorization && projectRef) {
      // Get organizations and compute opt in level server-side
      const { aiOptInLevel: orgAIOptInLevel } = await getOrgAIDetails({
        orgSlug,
        authorization,
        projectRef,
      })

      aiOptInLevel = orgAIOptInLevel
    }

    // For code completion, we always use the limited model
    const {
      model,
      error: modelError,
      promptProviderOptions,
      providerOptions,
    } = await getModel({
      provider: 'openai',
      routingKey: projectRef,
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    // Get a list of all schemas to add to context
    const pgMetaSchemasList = pgMeta.schemas.list()
    type Schemas = z.infer<(typeof pgMetaSchemasList)['zod']>

    const { result: schemas } =
      aiOptInLevel !== 'disabled'
        ? await executeSql<Schemas>(
            {
              projectRef,
              connectionString,
              sql: pgMetaSchemasList.sql,
            },
            undefined,
            {
              'Content-Type': 'application/json',
              ...(authorization && { Authorization: authorization }),
            },
            IS_PLATFORM ? undefined : executeQuery
          )
        : { result: [] }

    const schemasString =
      schemas?.length > 0
        ? `The available database schema names are: ${JSON.stringify(schemas)}`
        : "You don't have access to any schemas."

    // Important: do not use dynamic content in the system prompt or Bedrock will not cache it
    const system = source`
      ${GENERAL_PROMPT}
      ${OUTPUT_ONLY_PROMPT}
      ${language === 'sql' ? PG_BEST_PRACTICES : EDGE_FUNCTION_PROMPT}
      ${language === 'sql' && RLS_PROMPT}
      ${SECURITY_PROMPT}
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
        role: 'assistant',
        // Add any dynamic context here
        content: `
        You are helping me edit some code.
             Here is the context:
             ${textBeforeCursor}<selection>${selection}</selection>${textAfterCursor}

            The available database schema names are: ${schemasString}

             Instructions:
             1. Only modify the selected text based on this prompt: ${prompt}
             2. Your response should be ONLY the modified selection text, nothing else. Remove selected text if needed.
             3. Do not wrap in code blocks or markdown
             4. You can respond with one word or multiple words
             5. Ensure the modified text flows naturally within the current line
             6. Avoid duplicating code when considering the full statement
             7. If there is no surrounding context (before or after), make sure your response is a complete valid SQL statement that can be run and resolves the prompt.
             
             Modify the selected text now:
        `,
      },
    ]

    // Get tools
    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
    })

    const { text } = await generateText({
      model,
      providerOptions,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      tools,
    })

    return res.status(200).json(text)
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      error: 'Failed to generate completion',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
