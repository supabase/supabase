import { createFileRoute } from '@tanstack/react-router'
import { generateText, Output } from 'ai'
import { currentLogger } from 'braintrust'
import { IS_PLATFORM } from 'common'
import { z } from 'zod'

import { rateMessageResponseSchema } from '@/components/ui/AIAssistantPanel/Message.utils'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getAIDetails } from '@/lib/ai/ai-details'
import { IS_TRACING_ENABLED } from '@/lib/ai/braintrust-logger'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { sanitizeMessagePart } from '@/lib/ai/tools/tool-sanitizer'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

const requestBodySchema = z.object({
  rating: z.enum(['positive', 'negative']),
  messages: z.array(z.any()),
  messageId: z.string(),
  projectRef: z.string(),
  orgSlug: z.string().optional(),
  reason: z.string().optional(),
  spanId: z.string().optional(),
})

async function handlePost(request: Request): Promise<Response> {
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

  const { rating, messages: rawMessages, projectRef, orgSlug, reason, spanId } = data

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let orgId: number | undefined

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization && projectRef) {
    try {
      const aiDetails = await getAIDetails({ orgSlug, projectRef, authorization })

      aiOptInLevel = aiDetails.aiOptInLevel
      orgId = aiDetails.orgId
    } catch {
      return Response.json(
        { error: 'There was an error fetching your organization details' },
        { status: 400 }
      )
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
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return Response.json({ error: modelError.message }, { status: 500 })
    }

    const { output } = await generateText({
      ...modelParams,
      output: Output.object({ schema: rateMessageResponseSchema }),
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

    // A defined orgId means getAIDetails confirmed the project belongs to the organization.
    if (IS_TRACING_ENABLED && orgId !== undefined && spanId) {
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
          metadata: { feedbackCategory: output.category },
        })
      } catch (error) {
        console.error('Failed to log feedback to Braintrust:', error)
      }
    }

    return Response.json({
      category: output.category,
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Classifying feedback failed:`, error)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return Response.json({ error: 'The conversation is too large to analyze' }, { status: 400 })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return Response.json(
      { error: 'There was an unknown error analyzing the feedback.' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/ai/feedback/rate')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
