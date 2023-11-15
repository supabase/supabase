import { SchemaBuilder } from '@serafin/schema-builder'
import { stripIndent } from 'common-tags'
import { isError } from 'data/utils/error-check'
import { jsonrepair } from 'jsonrepair'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ErrorResponse,
} from 'openai'

const openAiKey = process.env.OPENAI_KEY

const generateTitleSchema = SchemaBuilder.emptySchema()
  .addString('title', {
    description: stripIndent`
      The generated title for the SQL snippet (short and concise).
      - Omit these words: 'SQL', 'Postgres', 'Query', 'Database'
    `,
  })
  .addString('description', {
    description: stripIndent`
      The generated description for the SQL snippet (longer and more detailed than title).
      - Read the SQL line by line and summarize it
    `,
  })

type GenerateTitleResult = typeof generateTitleSchema.T

const completionFunctions = {
  generateTitle: {
    name: 'generateTitle',
    description: 'Generates a short title and detailed description for a Postgres SQL snippet',
    parameters: generateTitleSchema.schema,
  },
}

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
    body: { sql },
  } = req

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 1024

  const completionMessages: ChatCompletionRequestMessage[] = [
    {
      role: 'user',
      content: sql,
    },
  ]

  const completionOptions: CreateChatCompletionRequest = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: completionFunctions.generateTitle.name,
    },
    functions: [completionFunctions.generateTitle],
    stream: false,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(completionOptions),
  })

  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    console.error(`AI title generation failed: ${errorResponse.error.message}`)

    if ('code' in errorResponse.error && errorResponse.error.code === 'context_length_exceeded') {
      return res.status(400).json({
        error:
          'Your SQL query is too large for Supabase AI to ingest. Try splitting it into smaller queries.',
      })
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the snippet title. Please try again.',
    })
  }

  const completionResponse: CreateChatCompletionResponse = await response.json()

  const [firstChoice] = completionResponse.choices

  const titleResponseString = firstChoice.message?.function_call?.arguments

  if (!titleResponseString) {
    console.error(
      `AI title generation failed: OpenAI response succeeded, but response format was incorrect`
    )

    return res.status(500).json({
      error: 'There was an unknown error generating the snippet title. Please try again.',
    })
  }

  try {
    // Attempt to repair broken JSON from OpenAI (eg. multiline strings)
    const repairedJsonString = jsonrepair(titleResponseString)

    const generateTitleResult: GenerateTitleResult = JSON.parse(repairedJsonString)

    if (!generateTitleResult.title) {
      console.error(`AI title generation failed: Unable to generate title for the given SQL`)

      res.status(400).json({
        error: 'Unable to generate title',
      })
    }

    return res.json(generateTitleResult)
  } catch (error) {
    console.error(
      `AI SQL editing failed: ${
        isError(error) ? error.message : 'An unknown error occurred'
      }, titleResponseString: ${titleResponseString}`
    )

    return res.status(500).json({
      error: 'There was an unknown error editing the SQL snippet. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
