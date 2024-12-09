import { ContextLengthError } from 'ai-commands'
import { generateCron } from 'ai-commands/edge'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

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
    const result = await generateCron(openai, prompt)

    return res.json(result)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI cron generation failed: ${error.message}`)

      if (error instanceof ContextLengthError) {
        return res.status(400).json({
          error:
            'Your cron prompt is too large for Supabase AI to ingest. Try splitting it into smaller prompts.',
        })
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the cron syntax. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
