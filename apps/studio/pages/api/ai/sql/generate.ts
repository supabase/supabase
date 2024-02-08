import { ContextLengthError, EmptySqlError, generateSql } from 'ai-commands'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

const openAiKey = process.env.OPENAI_KEY
const openai = new OpenAI({ apiKey: openAiKey })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_KEY set. Create this environment variable to use AI features.',
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
    body: { prompt, entityDefinitions },
  } = req

  try {
    const result = await generateSql(openai, prompt, entityDefinitions)
    return res.json(result)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI SQL generation failed: ${error.message}`)

      const hasEntityDefinitions = entityDefinitions !== undefined && entityDefinitions.length > 0

      if (error instanceof ContextLengthError && hasEntityDefinitions) {
        return res.status(400).json({
          error:
            'Your database metadata is too large for Supabase AI to ingest. Try disabling database metadata in AI settings.',
        })
      }

      if (error instanceof EmptySqlError) {
        res.status(400).json({
          error: 'Unable to generate SQL. Try adding more details to your prompt.',
        })
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the SQL snippet. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
