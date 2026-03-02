import { generateObject } from 'ai'
import { source } from 'common-tags'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const cronSchema = z.object({
  cron_expression: z.string().describe('The generated cron expression.'),
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
      routingKey: 'cron',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const result = await generateObject({
      model,
      providerOptions,
      schema: cronSchema,
      prompt: source`
        You are a cron syntax expert. Your purpose is to convert natural language time descriptions into valid cron expressions for pg_cron.

        Rules for responses:
        - For standard intervals (minutes and above), output cron expressions in the 5-field format supported by pg_cron
        - For second-based intervals, use the special pg_cron "x seconds" syntax
        - Do not provide any explanation of what the cron expression does
        - Do not ask for clarification if you need it. Just output the cron expression.

        Example input: "Every Monday at 3am"
        Example output: 0 3 * * 1

        Example input: "Every 30 seconds"
        Example output: 30 seconds

        Additional examples:
        - Every minute: * * * * *
        - Every 5 minutes: */5 * * * *
        - Every first of the month, at 00:00: 0 0 1 * *
        - Every night at midnight: 0 0 * * *
        - Every Monday at 2am: 0 2 * * 1
        - Every 15 seconds: 15 seconds
        - Every 45 seconds: 45 seconds

        Field order for standard cron:
        - minute (0-59)
        - hour (0-23)
        - day (1-31)
        - month (1-12)
        - weekday (0-6, Sunday=0)

        Important: pg_cron uses "x seconds" for second-based intervals, not "x * * * *".
        If the user asks for seconds, do not use the 5-field format, instead use "x seconds".

        Here is the user's prompt: ${prompt}
      `,
    })

    return res.json(result.object.cron_expression)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI cron generation failed: ${error.message}`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your cron prompt is too large for Supabase Assistant to ingest. Try splitting it into smaller prompts.',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the cron syntax. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
