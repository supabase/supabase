import { ContextLengthError, EmptySqlError, debugSql } from 'ai-commands'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

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
    body: { errorMessage, sql, entityDefinitions },
  } = req

  try {
    const result = await debugSql(openai, errorMessage, sql, entityDefinitions)
    return res.json(result)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI SQL debugging failed: ${error.message}`)

      const hasEntityDefinitions = entityDefinitions !== undefined && entityDefinitions.length > 0

      if (error instanceof ContextLengthError) {
        // If there are more entity definitions than the SQL provided, attribute the
        // error to the database metadata
        if (hasEntityDefinitions) {
          const definitionsLength = entityDefinitions.reduce(
            (sum: number, def: string) => sum + def.length,
            0
          )
          if (definitionsLength > sql.length) {
            return res.status(400).json({
              error:
                'Your database metadata is too large for Supabase AI to ingest. Try disabling database metadata in AI settings.',
            })
          }
        }
        // Otherwise attribute the error to the SQL being too large
        return res.status(400).json({
          error:
            'Your SQL query is too large for Supabase AI to ingest. Try splitting it into smaller queries.',
        })
      }

      if (error instanceof EmptySqlError) {
        res.status(400).json({
          error: 'Unable to debug SQL. No fix identified for the error.',
        })
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error debugging the SQL snippet. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
