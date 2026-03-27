import type { JwtPayload } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { IS_PLATFORM } from 'common'
import { source } from 'common-tags'
import { getModel } from 'lib/ai/model'
import {
  type AssistantModelId,
  DEFAULT_ASSISTANT_ADVANCE_MODEL_ID,
  DEFAULT_ASSISTANT_BASE_MODEL_ID,
  getAssistantModelEntry,
  isAssistantBaseModelId,
  isKnownAssistantModelId,
} from 'lib/ai/model.utils'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import apiWrapper from 'lib/api/apiWrapper'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

export const maxDuration = 60

const requestBodySchema = z.object({
  prompt: z.string().min(1).max(120_000),
  projectRef: z.string(),
  orgSlug: z.string().optional(),
  model: z.string().optional(),
})

const SYSTEM_PROMPT = source`
  You write very short plain-text project health summaries for the Supabase Studio home card.
  Rules:
  - Output plain sentences only: no markdown, no bullet characters, no numbered lists, no headings, no code fences.
  - Use second person ("you").
  - Stay under about 520 characters unless the user message asks for a different limit.
  - Only state facts that appear in the user message. If something is missing, omit it rather than guessing.
`

async function handler(req: NextApiRequest, res: NextApiResponse, _claims?: JwtPayload) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const parsed = requestBodySchema.safeParse(body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.issues })
  }

  const { prompt, projectRef, orgSlug, model: rawRequestedModel } = parsed.data

  const requestedModel: AssistantModelId | undefined =
    rawRequestedModel && isKnownAssistantModelId(rawRequestedModel) ? rawRequestedModel : undefined

  let hasAccessToAdvanceModel = false

  if (!IS_PLATFORM) {
    hasAccessToAdvanceModel = true
  }

  if (IS_PLATFORM) {
    if (!orgSlug) {
      return res.status(400).json({ error: 'orgSlug is required' })
    }
    try {
      const { aiOptInLevel, hasAccessToAdvanceModel: orgAdvance, isHipaaEnabled } =
        await getOrgAIDetails({
          orgSlug,
          authorization: authorization ?? '',
          projectRef,
        })

      if (isHipaaEnabled) {
        return res.status(403).json({ error: 'AI features are not available for this project.' })
      }
      if (aiOptInLevel === 'disabled') {
        return res.status(403).json({ error: 'Organization has not opted in to AI features.' })
      }

      hasAccessToAdvanceModel = orgAdvance
    } catch {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  const envThrottled = process.env.IS_THROTTLED !== 'false'

  let effectiveModel: AssistantModelId = requestedModel ?? DEFAULT_ASSISTANT_ADVANCE_MODEL_ID
  if (!hasAccessToAdvanceModel || (envThrottled && !isAssistantBaseModelId(effectiveModel))) {
    effectiveModel = DEFAULT_ASSISTANT_BASE_MODEL_ID
  }

  const { modelParams, error: modelError, promptProviderOptions } = await getModel({
    provider: 'openai',
    modelEntry: getAssistantModelEntry(effectiveModel),
  })

  if (modelError) {
    return res.status(500).json({ error: modelError.message })
  }

  try {
    const userContent = source`
      The following is read-only context from the Studio dashboard (project metadata, advisors, and observability snippets). Summarize it for the home card.

      ${prompt}
    `

    const result = await generateText({
      ...modelParams,
      maxOutputTokens: 400,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
          ...(promptProviderOptions ? { providerOptions: promptProviderOptions } : {}),
        },
        { role: 'user', content: userContent },
      ],
    })

    const summary = (result.text ?? '').trim()
    if (!summary) {
      return res.status(500).json({ error: 'The model returned an empty summary.' })
    }

    return res.status(200).json({ summary })
  } catch (error) {
    console.error('home-summary error:', error)
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to generate home summary.' })
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })
