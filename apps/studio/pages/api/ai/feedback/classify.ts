import { ContextLengthError } from 'ai-commands'
import { classifyFeedback } from 'ai-commands/edge'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

const openAiKey = process.env.OPENAI_API_KEY

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
    })
  }

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

  try {
    const result = await classifyFeedback(prompt)
    res.status(200).json({ feedback_category: result })
    return
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI feedback classification failed: ${error.message}`)

      if (error instanceof ContextLengthError) {
        return res.status(400).json({
          error:
            'Your feedback prompt is too large for Supabase AI to ingest. Try splitting it into smaller prompts.',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error classifying the feedback. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
