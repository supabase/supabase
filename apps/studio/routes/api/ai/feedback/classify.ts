import { createFileRoute } from '@tanstack/react-router'
import { generateText, Output } from 'ai'
import { z } from 'zod'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

async function handlePost(request: Request): Promise<Response> {
  const { prompt } = await parseJsonBody<{ prompt?: string }>(request)

  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }

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
      output: Output.object({
        schema: z.object({
          feedback_category: z.enum(['support', 'feedback', 'unknown']),
        }),
      }),
      temperature: 0,
      prompt: `
    Classify the following feedback as ONE of: support, feedback, unknown.
    - support: bug reports, help requests, or issues
    - feedback: feature requests or suggestions
    - unknown: unclear or unrelated

    If you can't determine support or feedback, always output "unknown".

    Only output a JSON object in this format: { "feedback_category": "support|feedback|unknown" }

    Examples:
    Feedback: "Whenever I try to invite a team member, the invite email doesn't get sent."
    Response: { "feedback_category": "support" }

    Feedback:  "I have reached the storage limit for my project and my plan. I cannot understand how I can expand the storage space in my project."
    Response: { "feedback_category": "support" }

    Feedback: "Please delete the project x in my account"
    Response: { "feedback_category": "support" }

    Feedback: "My billing page is broken"
    Response: { "feedback_category": "support" }

    Feedback: "I accidentally deleted my database—can it be recovered?"
    Response: { "feedback_category": "support" }

    Feedback: "My login tokens are expiring too quickly, even though I didn't change any settings."
    Response: { "feedback_category": "support" }

    Feedback: "Can you add more integrations?"
    Response: { "feedback_category": "feedback" }

    Feedback: "I'm getting charged for a project I thought I deleted. Can you help me stop billing?"
    Response: { "feedback_category": "support" }

    Feedback: "Could you support OAuth login for more providers like Apple or LinkedIn?"
    Response: { "feedback_category": "feedback" }

    Feedback: "It's unclear in the docs how to set up row-level security with multiple roles."
    Response: { "feedback_category": "feedback" }

    Feedback: "I am trying to pause my Pro project"
    Response: { "feedback_category": "feedback" }

    Feedback: "${prompt}"
    Response:
  `,
    })

    return Response.json({ feedback_category: output.feedback_category })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Classifying this feedback failed`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return Response.json({ error: 'This prompt is too large to ingest' }, { status: 400 })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return Response.json(
      { error: 'There was an unknown error generating the feedback category.' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/ai/feedback/classify')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
