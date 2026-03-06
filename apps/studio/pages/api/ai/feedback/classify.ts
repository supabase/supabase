import { generateObject } from 'ai'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

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
  const {
    body: { prompt },
  } = req

  if (!prompt) {
    return res.status(400).json({
      error: 'Prompt is required',
    })
  }

  try {
    const {
      model,
      error: modelError,
      providerOptions,
    } = await getModel({
      provider: 'openai',
      routingKey: 'feedback',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const { object } = await generateObject({
      model,
      providerOptions,
      schema: z.object({
        feedback_category: z.enum(['support', 'feedback', 'unknown']),
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

    return res.json({ feedback_category: object.feedback_category })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Classifying this feedback failed`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'This prompt is too large to ingest',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the feedback category.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
