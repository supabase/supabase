import { generateObject } from 'ai'
import { currentLogger } from 'braintrust'
import { IS_PLATFORM } from 'common'
import { rateMessageResponseSchema } from 'components/ui/AIAssistantPanel/Message.utils'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { IS_TRACING_ENABLED } from 'lib/ai/braintrust-logger'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import { sanitizeMessagePart } from 'lib/ai/tools/tool-sanitizer'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

export const maxDuration = 30

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

const requestBodySchema = z.object({
  rating: z.enum(['positive', 'negative']),
  messages: z.array(z.any()),
  messageId: z.string(),
  projectRef: z.string(),
  orgSlug: z.string().optional(),
  reason: z.string().optional(),
  spanId: z.string().optional(),
})

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

  const { rating, messages: rawMessages, projectRef, orgSlug, reason, spanId } = data

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let isHipaaEnabled = false

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization && projectRef) {
    try {
      // Get organizations and compute opt in level server-side
      const { aiOptInLevel: orgAIOptInLevel, isHipaaEnabled: orgIsHipaaEnabled } =
        await getOrgAIDetails({
          orgSlug,
          authorization,
          projectRef,
        })

      aiOptInLevel = orgAIOptInLevel
      isHipaaEnabled = orgIsHipaaEnabled
    } catch (error) {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  // Only returns last 7 messages
  // Filters out tool outputs based on opt-in level using sanitizeMessagePart
  const messages = (rawMessages || []).slice(-7).map((msg: any) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts.map((part: any) => {
        return sanitizeMessagePart(part, aiOptInLevel)
      })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })

  try {
    const {
      model,
      error: modelError,
      providerOptions,
    } = await getModel({
      provider: 'openai',
      isLimited: true,
      routingKey: 'feedback',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const { object } = await generateObject({
      model,
      providerOptions,
      schema: rateMessageResponseSchema,
      prompt: `
Your job is to look at a Supabase Assistant conversation, which the user has given feedback on, and classify it.

The user gave this feedback: ${rating === 'positive' ? 'THUMBS UP (positive)' : 'THUMBS DOWN (negative)'}
${reason ? `\nUser's reason: ${reason}` : ''}

Raw conversation:
${JSON.stringify(messages)}

Instructions:
1. Classify the conversation into ONE of these categories:
   - sql_generation: Generating SQL queries, DML statements
   - schema_design: Creating tables, columns, relationships
   - rls_policies: Row Level Security policies
   - edge_functions: Edge Functions or serverless functions
   - database_optimization: Performance, indexes, optimization
   - debugging: Helping debug errors or issues
   - general_help: General questions about Supabase features
   - other: Anything else
`,
    })

    // Log feedback to Braintrust if tracing is enabled and span ID is available
    if (IS_TRACING_ENABLED && !isHipaaEnabled && spanId) {
      try {
        const logger = currentLogger()
        logger?.logFeedback({
          id: spanId,
          scores: { 'User Rating': rating === 'positive' ? 1 : 0 },
          comment: reason,
          source: 'external',
        })
        logger?.updateSpan({
          id: spanId,
          metadata: { feedbackCategory: object.category },
        })
      } catch (error) {
        console.error('Failed to log feedback to Braintrust:', error)
      }
    }

    return res.json({
      category: object.category,
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Classifying feedback failed:`, error)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'The conversation is too large to analyze',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error analyzing the feedback.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
